const express = require("express");
const http = require("http");
const TranscriptionService = require("./transcriptionService");
const FileLogger = require("./fileLogger");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Custom Transcriber Service is running");
});

const server = http.createServer(app);

const config = {
  DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
  PORT: process.env.PORT || 3001,
};

const logger = new FileLogger();
const transcriptionService = new TranscriptionService(config, logger);

transcriptionService.setupWebSocketServer = function (server) {
  const WebSocketServer = require("ws").Server;
  const wss = new WebSocketServer({ server, path: "/api/custom-transcriber" });
  wss.on("connection", (ws) => {
    logger.logDetailed(
      "INFO",
      "New WebSocket client connected on /api/custom-transcriber",
      "Server"
    );
    ws.on("message", (data, isBinary) => {
      if (!isBinary) {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "start") {
            logger.logDetailed(
              "INFO",
              "Received start message from client",
              "Server",
              { sampleRate: msg.sampleRate, channels: msg.channels }
            );
          }
        } catch (err) {
          logger.error("JSON parse error", err, "Server");
        }
      } else {
        transcriptionService.send(data);
      }
    });
    ws.on("close", () => {
      logger.logDetailed("INFO", "WebSocket client disconnected", "Server");
      if (
        transcriptionService.deepgramLive &&
        transcriptionService.deepgramLive.getReadyState() === 1
      ) {
        transcriptionService.deepgramLive.finish();
      }
    });
    ws.on("error", (error) => {
      logger.error("WebSocket error", error, "Server");
    });
    transcriptionService.on("transcription", (text, channel) => {
      const response = {
        type: "transcriber-response",
        transcription: text,
        channel,
      };
      ws.send(JSON.stringify(response));
      logger.logDetailed("INFO", "Sent transcription to client", "Server", {
        channel,
        text,
      });
    });
    transcriptionService.on("transcriptionerror", (err) => {
      ws.send(
        JSON.stringify({ type: "error", error: "Transcription service error" })
      );
      logger.error("Transcription service error", err, "Server");
    });
  });
};

transcriptionService.setupWebSocketServer(server);

server.listen(config.PORT, () => {
  console.log(`Server is running on http://localhost:${config.PORT}`);
});
