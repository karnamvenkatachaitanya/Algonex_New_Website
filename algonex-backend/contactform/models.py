from django.db import models

class ContactForm(models.Model):
    FORM_TYPE_CHOICES = [
        ("contact", "Contact Inquiry"),
        ("lead", "Course Interest Lead"),     # Absorbs SigninProfile
        ("support", "Support Request"),
    ]

    form_type = models.CharField(max_length=20, choices=FORM_TYPE_CHOICES, default="contact", db_index=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=150, db_index=True)
    phone = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=150, blank=True)
    message = models.TextField(blank=True)
    
    # Lead profile fields (absorbed from SigninProfile)
    college = models.CharField(max_length=150, blank=True)
    branch = models.CharField(max_length=150, blank=True)
    course_interested = models.CharField(max_length=150, blank=True)
    employment_status = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=100, blank=True)
    years_of_experience = models.CharField(max_length=10, blank=True)
    passed_out_year = models.CharField(max_length=10, blank=True)
    
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_form_type_display()} - {self.full_name} ({self.email})"
