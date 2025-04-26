# backend/lead_profile/urls.py
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet

router = DefaultRouter()
router.register(r'', LeadViewSet, basename='lead')

urlpatterns = router.urls