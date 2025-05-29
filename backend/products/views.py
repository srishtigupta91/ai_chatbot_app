# backend/products/views.py
from rest_framework import viewsets, response
from .models import Products
from .serializers import ProductsSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Products.objects.all()
    serializer_class = ProductsSerializer

    def get_queryset(self):
        # Get the company_id from query parameters
        company_id = self.request.query_params.get('company_id', None)
        if company_id:
            # Filter products by company_id
            return Products.objects.filter(company_id=company_id)
        # Return all products if no company_id is provided
        return super().get_queryset()

    def retrieve(self, request, *args, **kwargs):
        # Retrieve the company_id from the URL kwargs
        company_id = kwargs.get("pk")
        if not company_id:
            return response.Response({"error": "Company ID is required"}, status=400)

        # Filter products by company_id
        products = Products.objects.filter(company_id=company_id)
        serializer = self.get_serializer(products, many=True)


        return response.Response({"data": serializer.data}, status=200)

