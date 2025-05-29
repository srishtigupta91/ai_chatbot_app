from celery import shared_task
from django.core.mail import send_mail
from .models import ScheduleMeeting
from datetime import datetime, timedelta

@shared_task
def send_meeting_reminder(meeting_id):
    try:
        meeting = ScheduleMeeting.objects.get(id=meeting_id)
        participants = meeting.participants.all()
        participant_emails = [participant.email for participant in participants]

        # Send reminder email
        send_mail(
            subject=f"Reminder: Meeting Scheduled for {meeting.event.name}",
            message=f"Reminder: Your meeting is scheduled for {meeting.meeting_datetime} at {meeting.meeting_location}.",
            from_email="noreply@example.com",
            recipient_list=participant_emails,
        )
    except ScheduleMeeting.DoesNotExist:
        pass