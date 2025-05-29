from django.urls import path
from .views import ExtractBusinessCardDetailsView, webhook_view
urlpatterns = [
    path('upload/', ExtractBusinessCardDetailsView.as_view(), name='scan_business_card'),
    path('verify_info/webhook/', webhook_view, name='get_webhook_url'),
]