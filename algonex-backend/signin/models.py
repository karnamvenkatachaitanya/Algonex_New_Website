from django.conf import settings
from django.db import models
from common.mixins import TimestampMixin


class SigninProfile(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    college = models.CharField(max_length=150)
    branch = models.CharField(max_length=150, blank=True)
    location = models.CharField(max_length=100, blank=True)
    course_interested = models.CharField(max_length=150, blank=True)
    employment_status = models.CharField(max_length=50, blank=True)
    years_of_experience = models.CharField(max_length=10, blank=True)
    passed_out_year = models.CharField(max_length=10, blank=True)
    specific_interests = models.TextField(blank=True)
    agreed_to_terms = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.email})"


class RegistrationProfile(TimestampMixin, models.Model):
    """Extended profile data collected during progressive registration."""

    DEGREE_CHOICES = [
        ("diploma", "Diploma"),
        ("bachelors", "Bachelors"),
        ("masters", "Masters"),
        ("phd", "PhD"),
        ("other", "Other"),
    ]

    EMPLOYMENT_CHOICES = [
        ("student", "Student"),
        ("employed", "Employed"),
        ("freelancer", "Freelancer"),
        ("unemployed", "Unemployed"),
    ]

    INTEREST_CHOICES = [
        ("fellowship", "Fellowship"),
        ("internship", "Internship"),
        ("workshop", "Workshop"),
        ("course", "Course"),
        ("other", "Other"),
    ]

    # Link to user
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="registration_profile",
    )

    # Address
    street_address = models.TextField(blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default="India")
    pincode = models.CharField(max_length=10, blank=True)

    # Education
    college = models.CharField(max_length=255)
    branch = models.CharField(max_length=100)
    degree_level = models.CharField(max_length=20, choices=DEGREE_CHOICES)
    graduation_year = models.PositiveIntegerField()
    current_year = models.CharField(max_length=20, blank=True)

    # Employment
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_CHOICES)
    years_of_experience = models.PositiveIntegerField(default=0)

    # Training interest
    interest_category = models.CharField(max_length=20, choices=INTEREST_CHOICES)
    program = models.ForeignKey(
        "programs.Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="registration_profiles",
    )
    specific_interests = models.TextField(blank=True)

    # Meta
    terms_agreed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.get_interest_category_display()}"


class StudentRegistration(models.Model):
    student_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    dob = models.CharField(max_length=20)
    gender = models.CharField(max_length=20)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    college_name = models.CharField(max_length=255)
    branch = models.CharField(max_length=150)
    current_year = models.CharField(max_length=50)
    course_selected = models.CharField(max_length=150)
    batch_type = models.CharField(max_length=50)
    joining_date = models.CharField(max_length=20)
    total_fee = models.DecimalField(max_digits=10, decimal_places=2)
    paid_fee = models.DecimalField(max_digits=10, decimal_places=2)
    balance_fee = models.DecimalField(max_digits=10, decimal_places=2)
    upi_transaction_id = models.CharField(max_length=100)
    photo = models.ImageField(upload_to="registration_photos/", blank=True, null=True)
    registration_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="Active")

    class Meta:
        ordering = ["-registration_date"]

    def __str__(self):
        return f"{self.full_name} ({self.student_id}) - {self.course_selected}"
