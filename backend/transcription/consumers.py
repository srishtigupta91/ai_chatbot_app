import os

from channels.generic.websocket import AsyncWebsocketConsumer
import json
from dotenv import load_dotenv
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions

load_dotenv()

class DeepgramWebSocket(AsyncWebsocketConsumer):

    async def connect(self):
        # Accept the WebSocket connection
        await self.accept()
        self.deepgram_client = DeepgramClient(api_key=os.getenv('DEEPGRAM_API_KEY'))
        self.dg_connection = self.deepgram_client.listen.websocket.v("1")
        self.is_finals = []

        # Setup Deepgram event listeners
        self.dg_connection.on(LiveTranscriptionEvents.Transcript, self.on_message)
        self.dg_connection.on(LiveTranscriptionEvents.Close, self.on_close)
        self.dg_connection.on(LiveTranscriptionEvents.Error, self.on_error)

    async def disconnect(self, close_code):
        # Close the Deepgram connection
        self.dg_connection.finish()

    async def receive(self, text_data):
        # Receive WebSocket message from frontend
        data = json.loads(text_data)
        if "url" in data:
            # Start transcription with the provided URL
            options = LiveOptions(
                model="nova-3",
                language="en-US",
                smart_format=True,
                encoding="linear16",
                channels=1,
                sample_rate=16000,
                interim_results=True,
                utterance_end_ms="1000",
                vad_events=True,
                endpointing=300,
            )
            addons = {"no_delay": "true"}
            self.dg_connection.start(options, addons=addons, url=data["url"])

    def on_message(self, result, **kwargs):
        # Handle transcription results
        print("\n Result: ", result)

        sentence = result.channel.alternatives[0].transcript
        if result.is_final:
            self.is_finals.append(sentence)
            if result.speech_final:
                utterance = " ".join(self.is_finals)
                self.is_finals = []
                # Send final transcription to frontend
                self.send(text_data=json.dumps({"type": "final", "transcript": utterance}))
        else:
            # Send interim transcription to frontend
            self.send(text_data=json.dumps({"type": "interim", "transcript": sentence}))

    def on_close(self, close, **kwargs):
        # Handle WebSocket close
        self.send(text_data=json.dumps({"type": "close", "message": "Connection closed"}))

    def on_error(self, error, **kwargs):
        # Handle errors
        self.send(text_data=json.dumps({"type": "error", "message": str(error)}))