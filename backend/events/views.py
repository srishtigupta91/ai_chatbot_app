from rest_framework import viewsets, views, status, response

from .models import Event
from .serializers import EventSerializer, ScheduleMeetingSerializer


# Create your views here.
class EventViewSet(viewsets.ModelViewSet):
    model = Event
    serializer_class = EventSerializer
    queryset = model.objects.all()


class ScheduleMeetingView(views.APIView):

    def post(self, request, *args, **kwargs):
        serializer = ScheduleMeetingSerializer(data=request.data)
        if serializer.is_valid():
            company_id = serializer.validated_data['company_id']
            event_name = serializer.validated_data['event_name']
            try:
                event = Event.objects.get(name=event_name, company_id=company_id)
            except Event.DoesNotExists:
                return response.Response(
                    {'message': "No Event available"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer.validated_data.pop('event_name')
            serializer.validated_data.pop('company_id')
            serializer.validated_data['event'] = event
            # Save the meeting
            serializer.save()
            return response.Response({"message": "Meeting invite sent"}, status=status.HTTP_201_CREATED)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
