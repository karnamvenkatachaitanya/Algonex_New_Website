from django.contrib.auth import get_user_model
from django.db import IntegrityError
from .models import RegistrationProfile
from .exceptions import UserNotFound, TermsNotAgreed

User = get_user_model()


def register_step1(*, first_name, last_name, email, phone):
    """Create or find a user by email. No password set for new users."""
    try:
        user = User.objects.get(email=email)
        return {
            "is_new": False,
            "has_password": user.has_usable_password(),
        }
    except User.DoesNotExist:
        pass

    # Create new user with no password
    # Use savepoints for PostgreSQL compatibility on IntegrityError
    from django.db import transaction
    username = email.split("@")[0]
    user = None
    for suffix in [""] + [str(i) for i in range(1, 100)]:
        candidate = f"{username}{suffix}"
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    password=None,
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                    username=candidate,
                )
            break
        except IntegrityError:
            continue

    if user is None:
        raise ValueError(f"Could not generate unique username for {email}")

    return {"is_new": True}


def register_step2(*, email, program_slug=None, terms_agreed, **profile_data):
    """Create or update RegistrationProfile for the user."""
    if not terms_agreed:
        raise TermsNotAgreed()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise UserNotFound()

    # Resolve program if slug provided
    program = None
    if program_slug:
        from programs.models import Program
        program = Program.objects.filter(slug=program_slug, is_published=True).first()

    profile_data["program"] = program
    profile_data["terms_agreed"] = terms_agreed

    RegistrationProfile.objects.update_or_create(
        user=user,
        defaults=profile_data,
    )

    return {"registered": True}
