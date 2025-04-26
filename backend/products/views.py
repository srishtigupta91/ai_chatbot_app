# backend/products/views.py
from rest_framework import viewsets
from .models import Products
from .serializers import ProductsSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Products.objects.all()
    serializer_class = ProductsSerializer
