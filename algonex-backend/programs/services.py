from .models import Program


def create_program(**data):
    """Create a new program. Always starts as unpublished draft."""
    data["is_published"] = False
    return Program.objects.create(**data)


def update_program(*, program, **data):
    """Update an existing program's fields."""
    for field, value in data.items():
        setattr(program, field, value)
    program.save()
    return program
