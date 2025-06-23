# accounts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, UserViewSet, LogoutView, AllAPIsList

from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('all_apis/', AllAPIsList.as_view(), name='äpis')
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)