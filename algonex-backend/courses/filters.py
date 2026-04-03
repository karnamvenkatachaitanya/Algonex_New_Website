import django_filters
from .models import Course


class CourseFilter(django_filters.FilterSet):
    level = django_filters.ChoiceFilter(choices=Course.LEVEL_CHOICES)
    is_trending = django_filters.BooleanFilter()
    search = django_filters.CharFilter(field_name="name", lookup_expr="icontains")

    class Meta:
        model = Course
        fields = ["level", "is_trending"]
