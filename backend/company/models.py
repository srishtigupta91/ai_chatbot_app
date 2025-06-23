from django.db import models

# Create your models here.
# models.py
class Company(models.Model):
    company_id = models.CharField(max_length=100, unique=True)
    company_address = models.TextField()
    founder = models.CharField(max_length=100, null=True, blank=True)
    tagline = models.CharField(max_length=100, null=True, blank=True)
    display_name = models.CharField(max_length=100)
    company_info = models.TextField()
    company_type = models.CharField(max_length=50)
    required_fields = models.JSONField(default=list, null=True, blank=True)
    optional_fields = models.JSONField(default=list, null=True, blank=True)
    conversation_goal = models.TextField(null=True, blank=True)
    initial_greeting_prompt = models.TextField(null=True, blank=True)
    conversation_prompt = models.TextField(null=True, blank=True)