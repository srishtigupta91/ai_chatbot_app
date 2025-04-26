import json
import logging
import asyncio
import websockets
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger("transcriber")

DEEPGRAM_API_KEY = "13c9fb99673346458a52cc97a80937d2f8bf1623"  # replace with env variable or settings
DEEPGRAM_URL = "wss://api.deepgram.com/v1/listen?model=nova-2&interim_results=true&smart_format=true&language=en&multichannel=true"

class TranscriberConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        logger.info("WebSocket client connected")

        # Start connection to Deepgram
        self.deepgram_ws = await websockets.connect(
            DEEPGRAM_URL,
            extra_headers={"Authorization": f"Token {DEEPGRAM_API_KEY}"},
        )
        self.transcript_buffer = {"customer": "", "assistant": ""}
        self.debounce_delay = 3  # seconds

        # Start background listener
        self.listener_task = asyncio.create_task(self.listen_to_deepgram())

    async def disconnect(self, close_code):
        logger.info("WebSocket client disconnected")
        if hasattr(self, "deepgram_ws"):
            await self.deepgram_ws.close()
        if hasattr(self, "listener_task"):
            self.listener_task.cancel()

    async def receive(self, text_data=None, bytes_data=None):
        if text_data:
            try:
                msg = json.loads(text_data)
                if msg.get("type") == "start":
                    logger.info("Received start message from client")
            except json.JSONDecodeError as e:
                logger.error(f"JSON parse error: {e}")
        elif bytes_data:
            try:
                if self.deepgram_ws.open:
                    await self.deepgram_ws.send(bytes_data)
            except Exception as e:
                logger.error(f"Error sending audio to Deepgram: {e}")
                await self.send_error("Error sending audio to Deepgram")

    async def listen_to_deepgram(self):
        try:
            async for message in self.deepgram_ws:
                try:
                    response = json.loads(message)
                    if "channel" in response:
                        channel_index = response.get("channel_index", [0])[0]
                        channel = "customer" if channel_index == 0 else "assistant"
                        text = response["channel"]["alternatives"][0].get("transcript", "").strip()
                        if not text:
                            continue
                        logger.info(f"Transcript received [{channel}]: {text}")
                        self.transcript_buffer[channel] += f" {text}"
                        await self.send_transcription(text, channel)
                except Exception as e:
                    logger.error(f"Error parsing Deepgram message: {e}")
        except asyncio.CancelledError:
            logger.info("Deepgram listener task cancelled")
        except Exception as e:
            logger.error(f"Deepgram WebSocket error: {e}")
            await self.send_error("Deepgram connection error")

    async def send_transcription(self, text, channel):
        await self.send(text_data=json.dumps({
            "type": "transcriber-response",
            "transcription": text,
            "channel": channel,
        }))

    async def send_error(self, message):
        await self.send(text_data=json.dumps({
            "type": "error",
            "error": message,
        }))
