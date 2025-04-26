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