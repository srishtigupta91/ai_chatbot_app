# myproject/asgi.py

import os
import django
from channels.routing import get_default_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from transcription.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_default_application(),  # Handles traditional HTTP requests
    "websocket": URLRouter(websocket_urlpatterns),  # Handles WebSocket routes
})
