from courses.models import Course


class ProgramManager(Course._default_manager.__class__):
    """Default manager for Program proxy – auto-filters to fellowship/internship."""

    def get_queryset(self):
        return super().get_queryset().filter(course_type__in=["fellowship", "internship"])


class Program(Course):
    """Proxy model that provides a Programs-specific view of the Course table."""

    objects = ProgramManager()

    class Meta:
        proxy = True
        ordering = ["-is_featured", "-created_at"]
        verbose_name = "Program"
        verbose_name_plural = "Programs"

    # ── Convenience aliases so callers can use program.title / program.program_type ──
    @property
    def title(self):
        return self.name

    @title.setter
    def title(self, value):
        self.name = value

    @property
    def program_type(self):
        return self.course_type

    @program_type.setter
    def program_type(self, value):
        self.course_type = value

    def __str__(self):
        return f"{self.name} ({self.get_course_type_display()})"

    def save(self, *args, **kwargs):
        # Ensure new programs get a zero price if not explicitly provided
        if self.price is None:
            self.price = 0
        # Auto-assign a default instructor if none provided (required FK on Course)
        if self.instructor_id is None:
            from django.contrib.auth import get_user_model
            from django.utils.crypto import get_random_string
            User = get_user_model()
            instructor = (
                User.objects.filter(role='instructor').first()
                or User.objects.filter(is_superuser=True).first()
                or User.objects.first()
            )
            if instructor is None:
                # Create a system user as last resort
                instructor = User.objects.create_user(
                    email="system@algonex.in",
                    password=get_random_string(12),
                    first_name="System",
                    last_name="Admin",
                    role="admin",
                )
            self.instructor = instructor
        super().save(*args, **kwargs)
