from django.contrib import admin

from .models import Conversation, PDFDocument, ConversationHistory


# Register your models here.
@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('created_by', 'content' ,'session_id', 'timestamp')
    search_fields = ('created_by__email','content', 'session_id')
    list_filter = ('timestamp',)

@admin.register(ConversationHistory)
class ConversationHistoryAdmin(admin.ModelAdmin):
    list_display = ('lead', 'summary', 'session_id')

@admin.register(PDFDocument)
class PDFDocumentAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'document', 'uploaded_at', 'summary')
    search_fields = ('vendor', 'summary')
    list_filter = ('uploaded_at',)