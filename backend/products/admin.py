from django.contrib import admin

from products.models import Products, CompanyProductInformation

# Register your models here.
admin.site.register(Products)
admin.site.register(CompanyProductInformation)