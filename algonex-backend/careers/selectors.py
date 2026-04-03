from .models import Job, Application


def get_active_jobs(*, filters=None):
    """Return active job listings."""
    qs = Job.objects.filter(is_active=True)

    if filters:
        if filters.get("department"):
            qs = qs.filter(department=filters["department"])
        if filters.get("job_type"):
            qs = qs.filter(job_type=filters["job_type"])
        if filters.get("is_remote"):
            qs = qs.filter(is_remote=True)
        if filters.get("search"):
            qs = qs.filter(title__icontains=filters["search"])

    return qs


def get_job_detail(*, slug):
    """Return a single job listing."""
    return Job.objects.filter(slug=slug, is_active=True).first()


def get_user_applications(*, user):
    """Return a user's job applications (excludes admin_notes)."""
    return (
        Application.objects.filter(applicant=user)
        .select_related("job")
    )


def get_job_applications(*, job):
    """Return all applications for a job (admin view)."""
    return (
        Application.objects.filter(job=job)
        .select_related("applicant")
    )
