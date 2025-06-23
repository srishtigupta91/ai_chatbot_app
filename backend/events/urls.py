# urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, ScheduleMeetingView

router = DefaultRouter()
router.register(r'', EventViewSet, basename='company')

urlpatterns = [
    path('schedule-meeting/', ScheduleMeetingView.as_view(), name='schedule-meeting'),
]

urlpatterns += router.urls