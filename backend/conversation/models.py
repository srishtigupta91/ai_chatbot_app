from django.db import models


# Create your models here.
class PDFDocument(models.Model):
    vendor = models.CharField(max_length=100)
    document = models.FileField(upload_to='pdfs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    summary = models.TextField(blank=True, null=True)

class Conversation(models.Model):
    role = models.CharField(max_length=20, choices=[('human', 'Human'), ('assistant', 'Assistant'), ('system', 'System'), ('tool', 'Tool')])
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    session_id = models.CharField(max_length=100, blank=True, null=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    stage = models.CharField(max_length=100, null=True, blank=True)

class ConversationHistory(models.Model):
    lead = models.ForeignKey('lead_profile.Lead', on_delete=models.CASCADE)
    session_id = models.CharField(max_length=100)
    messages = models.JSONField(default=list)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)