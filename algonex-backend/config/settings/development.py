"""
Development settings — DEBUG on, console email, PostgreSQL.
"""
import os
from .base import *  # noqa: F401,F403

DEBUG = True
SECRET_KEY = "django-insecure-dev-only-key-change-in-production"

ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "postgres"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "psql"),
        "HOST": os.environ.get("DB_HOST", "15.206.128.228"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}

MEDIA_ROOT = BASE_DIR / "media"

# CORS — allow Vite dev server
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Console email for password reset in dev
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
