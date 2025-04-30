from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationView, TranscribeAudioView

router = DefaultRouter()
# router.register(r'', ConversationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', ConversationView.as_view(), name='chat_conversation'),
    path('transcriber/', TranscribeAudioView.as_view(), name='transcribe-audio'),
]