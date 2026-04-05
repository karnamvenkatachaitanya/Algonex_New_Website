from .models import Program


def get_published_programs():
    """Return published programs. Annotation added after RegistrationProfile exists (Task 7)."""
    return Program.objects.filter(is_published=True)


def get_program_detail(*, slug):
    """Return a single published program by slug."""
    return Program.objects.filter(slug=slug, is_published=True).first()
