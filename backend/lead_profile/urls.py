from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import UpdateLeadWebhookView, LeadViewSet

router = DefaultRouter()
router.register(r'', LeadViewSet, basename='lead')

urlpatterns = [
    path('webhook/update-lead/', UpdateLeadWebhookView.as_view(), name='update_lead_webhook'),
    path('webhook/update-lead/<int:lead_id>/', UpdateLeadWebhookView.as_view(), name='update_lead_webhook'),
]

urlpatterns += router.urls