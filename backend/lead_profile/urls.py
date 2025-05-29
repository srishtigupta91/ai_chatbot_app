from django.urls import path
from .views import UpdateLeadWebhookView

urlpatterns = [
    path('webhook/update-lead/', UpdateLeadWebhookView.as_view(), name='update_lead_webhook'),
    path('webhook/update-lead/<int:lead_id>/', UpdateLeadWebhookView.as_view(), name='update_lead_webhook'),
]