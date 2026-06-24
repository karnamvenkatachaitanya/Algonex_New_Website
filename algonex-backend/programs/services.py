from .models import Program
from django.contrib.auth import get_user_model

User = get_user_model()


def create_program(**data):
    """Create a new program as Course. Always starts as unpublished draft."""
    data["is_published"] = False

    # Map serializer aliases to model field names
    if "title" in data:
        data.setdefault("name", data.pop("title"))
    if "program_type" in data:
        data.setdefault("course_type", data.pop("program_type"))

    # Assign a default instructor (required for Course)
    instructor = User.objects.filter(role='instructor').first() or User.objects.filter(is_superuser=True).first()
    if not instructor:
        instructor = User.objects.first()

    return Program.objects.create(instructor=instructor, **data)


def update_program(*, program, **data):
    """Update an existing program's fields (Course instance)."""
    # Map serializer aliases to model field names
    if "title" in data:
        data["name"] = data.pop("title")
    if "program_type" in data:
        data["course_type"] = data.pop("program_type")

    for field, value in data.items():
        setattr(program, field, value)
    program.save()
    return program
