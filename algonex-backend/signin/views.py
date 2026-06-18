from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
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
    permission_classes = [AllowAny]
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
    permission_classes = [AllowAny]
    throttle_scope = "registration"

    def post(self, request):
        serializer = Step2Serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = register_step2(**serializer.validated_data)
        return Response({"status": "success", "data": result}, status=status.HTTP_200_OK)


from decimal import Decimal
from .models import StudentRegistration
from .registration_utils import generate_student_id, create_id_card, create_invoice, send_confirmation_email

class StudentRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Get form fields
            full_name = request.data.get("fullName")
            email = request.data.get("email")
            phone = request.data.get("phone")
            dob = request.data.get("dob")
            gender = request.data.get("gender")
            city = request.data.get("city")
            state = request.data.get("state")
            college_name = request.data.get("collegeName")
            branch = request.data.get("branch")
            current_year = request.data.get("currentYear")
            course_selected = request.data.get("courseSelected")
            batch_type = request.data.get("batchType")
            joining_date = request.data.get("joiningDate")
            
            # Numeric fields
            total_fee = request.data.get("totalFee")
            paid_fee = request.data.get("paidFee")
            balance_fee = request.data.get("balanceFee")
            upi_transaction_id = request.data.get("upiTransactionId")
            student_id = request.data.get("studentId")
            photo = request.FILES.get("photo")

            # Validate required fields
            if not all([full_name, email, phone, upi_transaction_id, photo]):
                return Response(
                    {"error": "Missing required fields (fullName, email, phone, upiTransactionId, photo)"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate student ID if not provided
            if not student_id:
                student_id = generate_student_id()

            # Convert fees to Decimal
            try:
                total_fee = Decimal(str(total_fee))
                paid_fee = Decimal(str(paid_fee))
                balance_fee = Decimal(str(balance_fee))
            except Exception:
                return Response(
                    {"error": "Invalid fee values. Must be numeric."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create Student Registration record
            registration = StudentRegistration.objects.create(
                student_id=student_id,
                full_name=full_name,
                email=email,
                phone=phone,
                dob=dob,
                gender=gender,
                city=city,
                state=state,
                college_name=college_name,
                branch=branch,
                current_year=current_year,
                course_selected=course_selected,
                batch_type=batch_type,
                joining_date=joining_date,
                total_fee=total_fee,
                paid_fee=paid_fee,
                balance_fee=balance_fee,
                upi_transaction_id=upi_transaction_id,
                photo=photo
            )

            # Generate ID card
            card_path = create_id_card(
                student_id=student_id,
                name=full_name,
                course=course_selected,
                batch_type=batch_type,
                joining_date=joining_date,
                role="Trainee",
                photo_file=registration.photo
            )

            # Generate Invoice
            invoice_path = create_invoice(
                student_id=student_id,
                name=full_name,
                course=course_selected,
                batch_type=batch_type,
                joining_date=joining_date,
                total_fee=float(total_fee),
                paid_fee=float(paid_fee),
                balance_fee=float(balance_fee),
                transaction_id=upi_transaction_id,
                registration_date=registration.registration_date.isoformat()
            )

            # Send Email
            email_sent = send_confirmation_email(
                to_email=email,
                student_name=full_name,
                student_id=student_id,
                course=course_selected,
                batch_type=batch_type,
                joining_date=joining_date,
                card_path=card_path
            )

            return Response({
                "success": True,
                "student_id": student_id,
                "card_url": f"/media/cards/{student_id}.png",
                "invoice_url": f"/media/invoices/invoice_{student_id}.png",
                "email_sent": email_sent,
                "message": "Registration completed successfully!"
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.exception("Error during student registration pipeline")
            return Response(
                {"error": "Registration pipeline failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
