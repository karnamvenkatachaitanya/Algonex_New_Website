import django_filters
from .models import Event


class EventFilter(django_filters.FilterSet):
    event_type = django_filters.ChoiceFilter(choices=Event.TYPE_CHOICES)
    upcoming = django_filters.BooleanFilter(method="filter_upcoming")

    class Meta:
        model = Event
        fields = ["event_type"]

    def filter_upcoming(self, queryset, name, value):
        if value:
            from django.utils import timezone
            return queryset.filter(start_date__gt=timezone.now())
        return queryset
