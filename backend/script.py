import asyncio
import websockets

async def test_websocket():
    uri = "ws://localhost:8000/ws/transcriber/"
    headers = [("Authorization", "Bearer 13c9fb99673346458a52cc97a80937d2f8bf1623")]
    async with websockets.connect(uri) as websocket:
        print("Connected to WebSocket")
        await websocket.send("Test message")
        response = await websocket.recv()
        print(f"Received: {response}")

asyncio.run(test_websocket())