import os

import boto3
import json

import requests
from django.http import JsonResponse
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from langchain.schema import SystemMessage, HumanMessage

from lead_profile.models import Lead

load_dotenv()

aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
region_name=os.getenv('AWS_REGION')
openai_acess_key = os.getenv('OPENAI_API_KEY')

# Define the Pydantic model for the output
class BusinessCardOutput(BaseModel):
    full_name: str
    role: str = None
    company: str = None
    email: str = None
    phone: str = None
    website: str = None
    location: str = None

def connect_client(service_name):
    s3_client = boto3.client(
        service_name,
        aws_access_key_id=aws_access_key_id[0],
        aws_secret_access_key=aws_secret_access_key[0],
        region_name=region_name
    )
    return s3_client

# Function to upload file to AWS S3 and get the URL
def upload_file_to_s3(file_obj, bucket_name, file_name):
    s3_client = connect_client('s3')

    # Upload the file
    s3_client.upload_fileobj(file_obj, bucket_name, file_name)

    # Ensure all components are strings
    region_name = s3_client.meta.region_name
    if not isinstance(region_name, str):
        region_name = str(region_name)
    if not isinstance(bucket_name, str):
        bucket_name = str(bucket_name)
    if not isinstance(file_name, str):
        file_name = str(file_name)

    # Generate the file URL
    try:
        file_url = f"https://{bucket_name}.s3.{region_name}.amazonaws.com/{file_name}"
    except TypeError as e:
        raise TypeError(
            f"Error constructing file URL: {e}. Variables - bucket_name: {bucket_name}, region_name: {region_name}, file_name: {file_name}")

    return file_url

# Function to extract text from an image using AWS Textract
def extract_text_from_s3_image(bucket_name, file_name):
    textract_client = connect_client('textract')
    response = textract_client.detect_document_text(
        Document={'S3Object': {'Bucket': bucket_name, 'Name': file_name}}
    )
    extracted_text = " ".join([item['Text'] for item in response['Blocks'] if item['BlockType'] == 'LINE'])
    return extracted_text

# Webhook URL for verifying the extracted information and pass it to agent
# File: business_card/views.py
@csrf_exempt
def webhook_view(request):

    if request.method == "GET":
        last_lead_info = Lead.objects.all().order_by('-created_at').last()
        name = last_lead_info.full_name
        email = last_lead_info.email
        phone = last_lead_info.phone
        lead_info = {
            "email": email,
            "phone": phone,
            "full_name": name,
            "lead_id": last_lead_info.id,
            "address": last_lead_info.location
        }
        return JsonResponse(lead_info)

    if request.method == "POST":
        try:
            payload = json.loads(request.body)
            name = payload.get("full_name", "Unknown")
            email = payload.get("email", "Unknown")

            return JsonResponse({
                    "type": "say",
                    "messages": [{
                        "type": "text",
                        "text": f"Thanks for uploading your business card. I found the following details: Name: {name}, Email: {email}. Is that correct?"
                    }]
            })

            # Process the webhook payload here
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON payload"}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)

# API View to handle business card scanning
class ExtractBusinessCardDetailsView(APIView):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.client = OpenAI(api_key=openai_acess_key)
        self.output_parser = BusinessCardOutput

    def post(self, request, *args, **kwargs):
        # Check if an image is provided
        if 'file' not in request.FILES:
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Load the image
        image = request.FILES['file']
        file_name = image.name
        bucket_name = 'ai-engagement-app-bucket'

        # Upload the image to S3 and get the URL
        try:
            image_url = upload_file_to_s3(image, bucket_name, file_name)
        except Exception as e:
            return Response({"error": f"Failed to upload image to S3: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Extract text from the image using AWS Textract
        try:
            extracted_text = extract_text_from_s3_image(bucket_name, file_name)
        except Exception as e:
            return Response({"error": f"Failed to extract text from image: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Construct the prompt for OpenAI
        prompt_messages = [
            SystemMessage(
                content=f"""You are an expert business card scanner. Analyze the provided image of a business card and extract the contact information. Structure the output strictly as a JSON object following this Pydantic model format:

{self.output_parser.schema_json(indent=2)}

Extract only the information visible on the card. If a field is not present, omit it or set it to null/empty string as appropriate based on the format instructions. Do not infer information not present. Pay close attention to names, titles, company names, emails, phone numbers, websites, and any location details. Respond ONLY with the JSON object."""
            ),
            HumanMessage(
                content=f"Please extract the contact information from this business card image: {extracted_text}"
            )
        ]

        # Invoke the OpenAI client
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": prompt_messages[0].content},
                    {"role": "user", "content": prompt_messages[1].content}
                ],
                max_tokens=500,
                temperature=0.5
            )
            response_content = response.choices[0].message.content.strip()  # Extract the content

            # Validate if the response is valid JSON
            try:
                cleaned_string = response_content.replace('```json\n', '').replace('```', '')
                details_dict = json.loads(cleaned_string)  # Parse the JSON response
            except json.JSONDecodeError:
                return Response({"error": "Invalid JSON response from OpenAI"},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({"error": f"Failed to process the image: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save the details to the Lead model
        lead = Lead.objects.create(
            **details_dict
        )

        details_dict['lead_id'] = lead.id
        # Webhook URL
        # webhook_url = reverse("get_webhook_url")
        webhook_url = os.getenv('NGROK_API_URL') + os.getenv('VERIFY_CARD_INFO_API')
        try:
            webhook_response = requests.post(webhook_url, json=details_dict)
            webhook_response.raise_for_status()
            print(webhook_response.json())
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Failed to call webhook: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Return the extracted details
        return Response(details_dict, status=status.HTTP_200_OK)