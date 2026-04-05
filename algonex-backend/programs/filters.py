import django_filters
from .models import Program


class ProgramFilter(django_filters.FilterSet):
    program_type = django_filters.ChoiceFilter(choices=Program.TYPE_CHOICES)
    is_featured = django_filters.BooleanFilter()

    class Meta:
        model = Program
        fields = ["program_type", "is_featured"]
