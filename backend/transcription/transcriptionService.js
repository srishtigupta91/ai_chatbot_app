const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const EventEmitter = require("events");

const PUNCTUATION_TERMINATORS = [".", "!", "?"];
const MAX_RETRY_ATTEMPTS = 3;
const DEBOUNCE_DELAY_IN_SECS = 3;
const DEBOUNCE_DELAY = DEBOUNCE_DELAY_IN_SECS * 1000;
const DEEPGRAM_API_KEY = process.env["DEEPGRAM_API_KEY"] || "";

class TranscriptionService extends EventEmitter {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.flowLogger = require("./fileLogger").createNamedLogger(
      "transcriber-flow.log"
    );
    if (!DEEPGRAM_API_KEY) {
      throw new Error("Missing Deepgram API Key");
    }
    this.deepgramClient = createClient(DEEPGRAM_API_KEY);
    this.logger.logDetailed(
      "INFO",
      "Initializing Deepgram live connection",
      "TranscriptionService",
      {
        model: "nova-2",
        sample_rate: 16000,
        channels: 2,
      }
    );
    this.deepgramLive = this.deepgramClient.listen.live({
      encoding: "linear16",
      channels: 2,
      sample_rate: 16000,
      model: "nova-2",
      smart_format: true,
      interim_results: true,
      endpointing: 800,
      language: "en",
      multichannel: true,
    });
    this.finalResult = { customer: "", assistant: "" };
    this.audioBuffer = [];
    this.retryAttempts = 0;
    this.lastTranscriptionTime = Date.now();
    this.pcmBuffer = Buffer.alloc(0);

    this.deepgramLive.addListener(LiveTranscriptionEvents.Open, () => {
      this.logger.logDetailed(
        "INFO",
        "Deepgram connection opened",
        "TranscriptionService"
      );
      this.deepgramLive.on(LiveTranscriptionEvents.Close, () => {
        this.logger.logDetailed(
          "INFO",
          "Deepgram connection closed",
          "TranscriptionService"
        );
        this.emitTranscription();
        this.audioBuffer = [];
      });
      this.deepgramLive.on(LiveTranscriptionEvents.Metadata, (data) => {
        this.logger.logDetailed(
          "DEBUG",
          "Deepgram metadata received",
          "TranscriptionService",
          data
        );
      });
      this.deepgramLive.on(LiveTranscriptionEvents.Transcript, (event) => {
        this.handleTranscript(event);
      });
      this.deepgramLive.on(LiveTranscriptionEvents.Error, (err) => {
        this.logger.logDetailed(
          "ERROR",
          "Deepgram error received",
          "TranscriptionService",
          { error: err }
        );
        this.emit("transcriptionerror", err);
      });
    });
  }

  send(payload) {
    if (payload instanceof Buffer) {
      this.pcmBuffer =
        this.pcmBuffer.length === 0
          ? payload
          : Buffer.concat([this.pcmBuffer, payload]);
    } else {
      this.logger.warn("TranscriptionService: Received non-Buffer data chunk.");
    }
    if (this.deepgramLive.getReadyState() === 1 && this.pcmBuffer.length > 0) {
      this.sendBufferedData(this.pcmBuffer);
      this.pcmBuffer = Buffer.alloc(0);
    }
  }

  sendBufferedData(bufferedData) {
    try {
      this.logger.logDetailed(
        "INFO",
        "Sending buffered data to Deepgram",
        "TranscriptionService",
        { bytes: bufferedData.length }
      );
      this.deepgramLive.send(bufferedData);
      this.audioBuffer = [];
      this.retryAttempts = 0;
    } catch (error) {
      this.logger.logDetailed(
        "ERROR",
        "Error sending buffered data",
        "TranscriptionService",
        { error }
      );
      this.retryAttempts++;
      if (this.retryAttempts <= MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          this.sendBufferedData(bufferedData);
        }, 1000);
      } else {
        this.logger.logDetailed(
          "ERROR",
          "Max retry attempts reached, discarding data",
          "TranscriptionService"
        );
        this.audioBuffer = [];
        this.retryAttempts = 0;
      }
    }
  }

  handleTranscript(transcription) {
    if (!transcription.channel || !transcription.channel.alternatives?.[0]) {
      this.logger.logDetailed(
        "WARN",
        "Invalid transcript format",
        "TranscriptionService",
        { transcription }
      );
      return;
    }
    const text = transcription.channel.alternatives[0].transcript.trim();
    if (!text) return;
    const currentTime = Date.now();
    const channelIndex = transcription.channel_index
      ? transcription.channel_index[0]
      : 0;
    const channel = channelIndex === 0 ? "customer" : "assistant";
    this.logger.logDetailed(
      "INFO",
      "Received transcript",
      "TranscriptionService",
      { channel, text }
    );
    if (transcription.is_final || transcription.speech_final) {
      this.finalResult[channel] += ` ${text}`;
      this.emitTranscription();
    } else {
      this.finalResult[channel] += ` ${text}`;
      if (currentTime - this.lastTranscriptionTime >= DEBOUNCE_DELAY) {
        this.logger.logDetailed(
          "INFO",
          `Emitting transcript after ${DEBOUNCE_DELAY_IN_SECS}s inactivity`,
          "TranscriptionService"
        );
        this.emitTranscription();
      }
    }
    this.lastTranscriptionTime = currentTime;
  }

  emitTranscription() {
    for (const chan of ["customer", "assistant"]) {
      if (this.finalResult[chan].trim()) {
        const transcript = this.finalResult[chan].trim();
        this.logger.logDetailed(
          "INFO",
          "Emitting transcription",
          "TranscriptionService",
          { channel: chan, transcript }
        );
        this.emit("transcription", transcript, chan);
        this.finalResult[chan] = "";
      }
    }
  }
}

module.exports = TranscriptionService;
