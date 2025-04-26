import uuid

from rest_framework import viewsets, response, status

from company.models import Company
from company.serializers import CompanySerializer


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

    def retrieve(self, request, *args, **kwargs):
        # Fetch the company instance
        company = self.get_object()

        # Generate a unique session_id
        session_id = str(uuid.uuid4())

        # Serialize the company data
        serializer = self.get_serializer(company)

        # Return the response with session_id
        return response.Response({
            'session_id': session_id,
            'data': serializer.data
        }, status=status.HTTP_200_OK)
