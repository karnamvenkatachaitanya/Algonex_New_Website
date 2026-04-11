import django_filters
from .models import Job


class JobFilter(django_filters.FilterSet):
    department = django_filters.ChoiceFilter(choices=Job.DEPARTMENT_CHOICES)
    job_type = django_filters.ChoiceFilter(choices=Job.JOB_TYPE_CHOICES)
    is_remote = django_filters.BooleanFilter()
    search = django_filters.CharFilter(field_name="title", lookup_expr="icontains")
    apply_mode = django_filters.ChoiceFilter(choices=Job.APPLY_MODE_CHOICES)

    class Meta:
        model = Job
        fields = ["department", "job_type", "is_remote", "apply_mode"]
