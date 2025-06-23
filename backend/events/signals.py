# File: backend/events/signals.py
from datetime import timedelta

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ScheduleMeeting
from django.core.mail import send_mail
from celery import current_app
@receiver(post_save, sender=ScheduleMeeting)
def notify_participants(sender, instance, created, **kwargs):
    if created:
        # Fetch participant emails
        participants = instance.participants
        participant_emails = participants.split(",")

        # Send notification (example: email)
        send_mail(
            subject=f"Meeting Scheduled: {instance.event.name}",
            message=f"A meeting has been scheduled for {instance.meeting_datetime} at {instance.meeting_location}.",
            from_email="rini.srish@gmail.com",
            recipient_list=participant_emails,
            fail_silently=True
        )

@receiver(post_save, sender=ScheduleMeeting)
def schedule_meeting_reminder(sender, instance, created, **kwargs):
    if created:
        # Schedule the reminder 1 hour before the meeting
        reminder_time = instance.meeting_datetime - timedelta(hours=1)
        current_app.send_task(
            'backend.events.tasks.send_meeting_reminder',
            args=[instance.id],
            eta=reminder_time
        )