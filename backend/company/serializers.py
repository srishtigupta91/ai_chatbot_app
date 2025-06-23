from datetime import datetime

from rest_framework import serializers

from company.models import Company
from events.models import Event
from products.models import Products
from products.serializers import ProductsSerializer  # Assuming a ProductsSerializer exists

class CompanySerializer(serializers.ModelSerializer):
    event_name = serializers.SerializerMethodField(method_name="fetch_current_event_name")
    product_info = serializers.SerializerMethodField(method_name="fetch_products")
    product_ids = serializers.SerializerMethodField(method_name="fetch_product_ids")

    class Meta:
        model = Company
        fields = '__all__'  # Include all fields from the Company model

    def fetch_current_event_name(self, obj):
        # Filter events for the company that are currently active
        current_time = datetime.now()
        active_event = Event.objects.filter(
            end_date__gte=current_time
        ).last()
        # Return a list of event names
        return active_event.name

    def fetch_product_ids(self, obj):
        # Fetch all products related to the company
        product_ids = Products.objects.filter(company=obj).values_list('product_id', flat=True)
        return product_ids

    def fetch_products(self, obj):
        # Fetch all products related to the company
        products = Products.objects.filter(company=obj)
        return ProductsSerializer(products, many=True).data