from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .models import Event, ScheduleMeeting


class EventSerializer(serializers.ModelSerializer):

    class Meta:
        model = Event
        fields = '__all__'



class ScheduleMeetingSerializer(serializers.ModelSerializer):
    company_id = serializers.CharField(max_length=100)
    event_name = serializers.CharField(max_length=100)

    class Meta:
        model = ScheduleMeeting
        fields = ['id', 'company_id', 'event_name', 'participants', 'meeting_datetime', 'meeting_location']

    def validate(self, data):
        # Extract necessary fields
        company_id = data.get('company_id')
        event_name = data.get('event_name')
        participants = data.get('participants')
        meeting_datetime = data.get('meeting_datetime')

        # Check if the event exists
        try:
            event = Event.objects.get(name=event_name, company_id=company_id)
        except Event.DoesNotExist:
            raise ValidationError({'event_name': 'Event does not exist for the given company.'})

        # Check if a ScheduleMeeting already exists
        if ScheduleMeeting.objects.filter(
            event=event,
            participants__in=participants,
            meeting_datetime=meeting_datetime
        ).exists():
            raise ValidationError({'meeting': 'A meeting with the same details already exists.'})

        return data