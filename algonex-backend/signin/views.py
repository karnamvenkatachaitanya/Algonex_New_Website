from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import SigninProfileSerializer, Step1Serializer, Step2Serializer
from .services import register_step1, register_step2
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import logging

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class SigninFormView(APIView):
    def post(self, request):
        try:
            serializer = SigninProfileSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response({'message': 'Sign-in data saved successfully'}, status=status.HTTP_201_CREATED)
            else:
                logger.warning("Validation failed: %s", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("Unexpected error: %s", str(e))
            return Response({'error': 'Internal server error', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegisterStep1View(APIView):
    """POST /api/v1/register/step1/ — create or find user by email."""
    throttle_scope = "registration"

    def post(self, request):
        serializer = Step1Serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = register_step1(**serializer.validated_data)

        status_code = status.HTTP_201_CREATED if result.get("is_new") else status.HTTP_200_OK
        data = {k: v for k, v in result.items()}
        if result.get("has_password"):
            data["message"] = "Account exists. Login to manage your data."

        return Response({"status": "success", "data": data}, status=status_code)


class RegisterStep2View(APIView):
    """POST /api/v1/register/step2/ — create or update registration profile."""
    throttle_scope = "registration"

    def post(self, request):
        serializer = Step2Serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = register_step2(**serializer.validated_data)
        return Response({"status": "success", "data": result}, status=status.HTTP_200_OK)
