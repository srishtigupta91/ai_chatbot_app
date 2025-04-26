from rest_framework import viewsets

from .models import Event
from .serializers import EventSerializer


# Create your views here.
class EventViewSet(viewsets.ModelViewSet):

    model = Event
    serializer_class = EventSerializer
    queryset = model.objects.all()
