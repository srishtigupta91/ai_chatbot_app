from rest_framework import serializers

from .models import Products


class ProductsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Products
        fields = ['id', 'product_id', 'product_varieties', 'product_info', 'company']