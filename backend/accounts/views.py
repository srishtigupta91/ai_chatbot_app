# views.py
import os

from dotenv import load_dotenv
from openai import OpenAI
from rest_framework import viewsets, status, views, response
from rest_framework.authtoken.models import Token

from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password

from .models import User
from .serializers import UserSerializer


# Load environment variables from .env file
load_dotenv()

openai_acess_key = os.getenv('OPENAI_API_KEY')

# Set the OpenAI API key
client = OpenAI(api_key=openai_acess_key)


class LoginView(views.APIView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, email=username, password=password)

        if user is not None:
            # Generate or retrieve the token for the user
            token, _ = Token.objects.get_or_create(user=user)
            user_details = UserSerializer(user).data
            return response.Response({
                'user_id': user.id,
                'user_details': user_details,
                'token': token.key
            }, status=status.HTTP_200_OK)
        else:
            return response.Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        password = data.get('password')
        if password:
            data['password'] = make_password(password)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return response.Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class LogoutView(views.APIView):
    def post(self, request, *args, **kwargs):
        # Get the user's token
        token = Token.objects.filter(user=request.user).first()
        if token:
            # Delete the token to log the user out
            token.delete()
            return response.Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        return response.Response({"error": "Invalid token or user not logged in."}, status=status.HTTP_400_BAD_REQUEST)
