from rest_framework import serializers

from .models import Conversation, PDFDocument, ConversationHistory


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = '__all__'

class PDFDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDFDocument
        fields = '__all__'

class ConversationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationHistory
        fields = "__all__"
