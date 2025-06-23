from django.http import JsonResponse
import json

from rest_framework import views, viewsets

from .models import Lead
from .serializers import LeadSerializer


class LeadViewSet(viewsets.ModelViewSet):

    model = Lead
    serializer_class = LeadSerializer
    queryset = model.objects.all()

class UpdateLeadWebhookView(views.APIView):
    def post(self, request, *args, **kwargs):
        try:
            # Parse the JSON payload
            payload = json.loads(request.body)
            required_fields = ["full_name", "email", "phone", "address"]
            for field in required_fields:
                if field not in payload:
                    return JsonResponse({"error": f"{field} is required"}, status=400)

            # Create a new lead
            lead = Lead.objects.create(**payload)
            return JsonResponse({"message": "Lead created successfully", "lead_id": lead.id}, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    def patch(self, request, *args, **kwargs):
        try:
            # Parse the JSON payload
            payload = json.loads(request.body)
            lead_id = kwargs.get("lead_id")
            if not lead_id:
                return JsonResponse({"error": "Lead ID is required"}, status=400)

            # Fetch the lead object
            try:
                lead = Lead.objects.get(id=lead_id)
            except Lead.DoesNotExist:
                return JsonResponse({"error": "Lead not found"}, status=404)

            # Update the lead fields
            for key, value in payload.items():
                setattr(lead, key, value)
            lead.save()

            return JsonResponse({"message": "Lead updated successfully"}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON payload"}, status=400)
