from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationView, ConversationHistoryView

router = DefaultRouter()
router.register(r'save-chat', ConversationHistoryView)

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', ConversationView.as_view(), name='chat_conversation'),
]