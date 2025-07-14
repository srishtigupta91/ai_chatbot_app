from django.db import models

# Create your models here.
# models.py
class Lead(models.Model):
    full_name = models.CharField(max_length=100)
    company = models.CharField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    products_of_interest = models.JSONField(default=list)
    moq = models.CharField(max_length=100, blank=True, null=True)
    concerns = models.JSONField(default=list)
    preferred_contact = models.CharField(max_length=50, blank=True, null=True)
    interest_level = models.CharField(max_length=50, blank=True, null=True)
    follow_up_actions = models.JSONField(default=list)
    conversation_timestamp = models.DateTimeField(blank=True, null=True)
    event_name = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_recently_viewed = models.BooleanField(null=True, blank=True, default=False)
