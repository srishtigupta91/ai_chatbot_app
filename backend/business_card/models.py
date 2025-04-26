from django.db import models

# Create your models here.
# models.py
class BusinessCardInfo(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    image_data = models.TextField()  # Base64 encoded image data
    created_at = models.DateTimeField(auto_now_add=True)