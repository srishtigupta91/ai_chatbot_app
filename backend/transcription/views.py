# transcription/views.py
from rest_framework.views import APIView
from rest_framework.response import Response

class HealthCheckView(APIView):
    def get(self, request):
        return Response({"message": "Custom Transcriber Service is running"})