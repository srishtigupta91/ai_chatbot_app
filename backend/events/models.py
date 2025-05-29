from django.db import models

class Event(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_currently_active = models.BooleanField(null=True, blank=True)
    company = models.ForeignKey('company.Company', on_delete=models.CASCADE, related_name='events')

    def __str__(self):
        return self.name


class FollowUp(models.Model):
    event_title = models.CharField(max_length=255)
    event_location = models.CharField(max_length=255)
    event_type = models.CharField(max_length=100)
    datetime = models.DateTimeField()
    location = models.CharField(max_length=255)
    participants = models.TextField(help_text="Comma-separated list of participant names")

    def __str__(self):
        return self.event_title


class ScheduleMeeting(models.Model):
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='scheduled_meetings')
    participants = models.TextField(help_text="Comma-separated list of participant email addresses")
    meeting_datetime = models.DateTimeField()
    meeting_location = models.CharField(max_length=255)

    def __str__(self):
        return f"Meeting for {self.event.name} at {self.meeting_datetime}"