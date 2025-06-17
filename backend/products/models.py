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
    tag = models.CharField(max_length=100, null=True,blank=True)
    product_id = models.CharField(max_length=100, unique=True)
    product_varieties = models.JSONField(default=list)
    product_info = models.JSONField(default=list)
    key_highlights = models.TextField(null=True, blank=True)


class CompanyProductInformation(models.Model):
    company = models.ForeignKey(
        "company.Company",
        on_delete=models.CASCADE,
        related_name="company_products",
        null=True,blank=True
    )
    products = models.ManyToManyField(
        "products.Products",
        related_name="products_info",
        blank=True
    )
    description = models.TextField(null=True, blank=True)
    insights = models.TextField(null=True, blank=True)
