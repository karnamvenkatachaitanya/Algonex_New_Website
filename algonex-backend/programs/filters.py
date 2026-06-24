import django_filters
from .models import Program


class ProgramFilter(django_filters.FilterSet):
    program_type = django_filters.ChoiceFilter(
        field_name="course_type",
        choices=[("fellowship", "Fellowship"), ("internship", "Internship")]
    )
    is_featured = django_filters.BooleanFilter()

    class Meta:
        model = Program
        fields = ["program_type", "is_featured"]
