from django.urls import path
from .views import ExtractBusinessCardDetailsView

urlpatterns = [
    path('upload/', ExtractBusinessCardDetailsView.as_view(), name='scan_business_card'),
]