from django.db import models

# Create your models here.
# models.py
class Products(models.Model):
    company = models.ForeignKey(
        'company.Company',
        on_delete=models.CASCADE,
        related_name='products',
        null=True, blank=True
    )
    product_id = models.CharField(max_length=100, unique=True)
    product_varieties = models.JSONField(default=list)
    product_info = models.JSONField(default=list)