import os
import subprocess
from datetime import datetime

import moviepy
import requests
from PyPDF2 import PdfReader
from django.conf.locale import sr
from django.core.files.storage import FileSystemStorage
from django.shortcuts import get_object_or_404
from psycopg2 import DatabaseError
from rest_framework import viewsets, views, response, status
from rest_framework.exceptions import ValidationError, APIException
from rest_framework.parsers import MultiPartParser, FormParser
from docx import Document as DocxDocument
from dotenv import load_dotenv

from accounts.models import User
from company.models import Company
from products.models import Products
from .models import Conversation, PDFDocument, ConversationHistory
from .prompts import get_prompt, PROMPTS
from .serializers import PDFDocumentSerializer
from .utils import client, generate_summary
from lead_profile.models import Lead

load_dotenv()

# Create your views here.
class PDFDocumentViewSet(viewsets.ModelViewSet):
    queryset = PDFDocument.objects.all()
    serializer_class = PDFDocumentSerializer
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        pdf_document = serializer.save()
        file_extension = os.path.splitext(pdf_document.document.name)[1].lower()
        if file_extension == '.pdf':
            pdf_document.document_type = 'pdf'
            pdf_reader = PdfReader(pdf_document.document)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
        elif file_extension == '.docx':
            pdf_document.document_type = 'word'
            docx_document = DocxDocument(pdf_document.document)
            text = ""
            for paragraph in docx_document.paragraphs:
                text += paragraph.text
        else:
            raise ValidationError("Unsupported file type")

        pdf_document.summary = generate_summary(text)
        pdf_document.save()


class ConversationView(views.APIView):

    def analyze_stage_with_openai(self, user_input, prompt_details, data):
        """
        Analyze the stage based on user input using OpenAI.
        """
        # Prepare the system message with stage details
        system_message = {
            "role": "system",
            "content": f"You are an AI assistant. Analyze the user's input and determine the next stage of the conversation. "
                       f"Here are the stage details:\n{prompt_details}\n"
                       f"Already Present Information: \n{data}"
                       f"User input: {user_input}\n"
                       f"Respond with the next stage only."
        }

        # Call the OpenAI API
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[system_message],
                temperature=0.5,
                max_tokens=50
            )
            next_stage = response.choices[0].message.content.strip()
            return next_stage

        except APIException as e:
            raise Exception(f"Error analyzing stage: {str(e)}")

    def format_lead_info(self, lead_info, context):
        format_context = {
            "lead_name": lead_info['full_name'],
            "lead_company": lead_info['company'],
            "lead_location": lead_info['location']
        }
        context.update(**format_context)
        return context

    def post(self, request, *args, **kwargs):
        try:
            user_id = request.data.get('user_id')
            user_input = request.data.get('message')
            company_id = request.data.get('company_id')
            session_id = request.data.get('session_id')

            if not user_id or not user_input or not company_id:
                return response.Response({'error': 'user_id, message, and company_id are required.'},
                                         status=status.HTTP_400_BAD_REQUEST)

            # Fetch company and product details
            company = get_object_or_404(Company, company_id=company_id)

            # fetch the user details to create the lead
            user = get_object_or_404(User, id=user_id)

            products = Products.objects.filter(company=company)
            event_name = "Trade Show 2023"

            # Prepare context
            context = {
                "company_name": company.display_name,
                "event_name": event_name,  # Example event name
                "company_info": company.company_info,
                "products_info": ", ".join([product.product_info for product in products]),
                "lead_info_summary": "No lead info yet.",
                "product_varieties_info": ", ".join([product.product_varieties for product in products]),  # Example placeholder
            }

            # Retrieve or create a conversation for the user
            conversation = Conversation.objects.filter(
                created_by=user_id,
                session_id=session_id
            ).order_by('-timestamp').last()

            details_dict = {
                "full_name": user.first_name + " " + user.last_name,
                "email": user.email,
                "company": company_id,
                "role": user.role,
                'location': '',
                "conversation_timestamp": conversation.timestamp if conversation else None,
            }
            # fetch the lead details to get the conversation history and update the messages
            lead = Lead.objects.filter(
                **details_dict
            ).last()

            # fetch the conversation history and update the messages
            conversation_history = ConversationHistory.objects.filter(
                lead = lead,
                session_id=session_id
            ).last()
            # breakpoint()
            if not conversation:
                conversation, _ = Conversation.objects.get_or_create(
                    role='human',
                    content=user_input,
                    timestamp=datetime.now(),
                    created_by=user,
                    session_id=session_id,
                    stage='GREETING'
                )
            if not lead:
                lead, _ = Lead.objects.get_or_create(
                    **details_dict
                )
            if not conversation_history:
                conversation_history, _ = ConversationHistory.objects.get_or_create(
                    lead=lead,
                    session_id=session_id,
                    messages=[user_input],
                    start_time=datetime.now(),
                    summary="",
                    created_at=datetime.now()
                )

            # Update conversation history
            conversation_history.messages.append({"role": "user", "content": user_input})

            # update the lead info in context
            context = self.format_lead_info(details_dict, context)

            # Determine the current stage and select the appropriate prompt
            prompt = get_prompt(conversation.stage, context)

            # generate summary and update the summary details in conversation history

            summary = generate_summary(conversation_history.messages)
            conversation_history.summary = summary

            system_message = {
                "role": "system",
                "content": prompt.format(**context),
                "available_content": context
            }

            # Call the OpenAI API
            try:
                content = [{"role": msg["role"], "content": msg["content"]} for msg in conversation_history.messages if isinstance(msg, dict) and "role" in msg and "content" in msg]
                # Add the system message to the conversation history if it's the first interaction
                content.append(system_message)

                result = client.chat.completions.create(
                    model='gpt-4o',
                    messages=content,
                    temperature=0.5,
                    max_tokens=500
                )
                ai_response = result.choices[0].message.content.strip()

                # Update conversation history with AI response
                conversation_history.messages.append({"role": "assistant", "content": ai_response})

                # Determine the next stage and fetch the next prompt
                next_stage = self.analyze_stage_with_openai(user_input, PROMPTS, context)
                conversation.stage = next_stage
                conversation.save()
                conversation_history.save()

                next_prompt = get_prompt(next_stage, context)

                return response.Response({
                    'response': ai_response,
                    'current_prompt': prompt,
                    'next_prompt': next_prompt,
                    'next_stage': next_stage
                }, status=status.HTTP_200_OK)

            except APIException as e:
                return response.Response({'error': f'AI response error: {str(e)}'},
                                         status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return response.Response({'error': f'Unexpected error: {str(e)}'},
                                     status=status.HTTP_500_INTERNAL_SERVER_ERROR)