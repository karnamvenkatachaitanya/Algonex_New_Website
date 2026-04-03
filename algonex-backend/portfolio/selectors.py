from .models import CaseStudy


def get_published_case_studies(*, filters=None):
    """Return published case studies."""
    qs = CaseStudy.objects.filter(is_published=True).prefetch_related("tech_tags", "screenshots")

    if filters:
        if filters.get("industry"):
            qs = qs.filter(industry__icontains=filters["industry"])
        if filters.get("tech"):
            qs = qs.filter(tech_tags__name__icontains=filters["tech"]).distinct()

    return qs


def get_case_study_detail(*, slug):
    """Return a single case study with all related data."""
    return (
        CaseStudy.objects.filter(slug=slug, is_published=True)
        .prefetch_related("tech_tags", "screenshots")
        .first()
    )
