from .models import Application
from .exceptions import AlreadyApplied, JobNotActive, InvalidTransition

# Valid hiring pipeline transitions
VALID_TRANSITIONS = {
    "applied": ["reviewed", "rejected"],
    "reviewed": ["interview", "rejected"],
    "interview": ["hired", "rejected"],
    "hired": [],
    "rejected": [],
}


def submit_application(*, applicant, job, resume, cover_letter=""):
    """Submit an application to an active job."""
    if not job.is_active:
        raise JobNotActive()

    if Application.objects.filter(job=job, applicant=applicant).exists():
        raise AlreadyApplied()

    return Application.objects.create(
        job=job,
        applicant=applicant,
        resume=resume,
        cover_letter=cover_letter,
        status="applied",
    )


def transition_application(*, application, new_status, admin_notes=""):
    """Move application to a new status, enforcing valid transitions."""
    current = application.status
    allowed = VALID_TRANSITIONS.get(current, [])

    if new_status not in allowed:
        raise InvalidTransition(
            detail=f"Cannot transition from '{current}' to '{new_status}'. "
                   f"Allowed: {allowed or 'none (terminal state)'}."
        )

    application.status = new_status
    if admin_notes:
        application.admin_notes = admin_notes
    application.save()
    return application
