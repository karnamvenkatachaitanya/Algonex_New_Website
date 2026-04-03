from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to admin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsInstructor(BasePermission):
    """Allow access to instructor or admin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("instructor", "admin")
        )


class IsAuthenticatedUser(BasePermission):
    """Allow access to any authenticated user (all roles — student, instructor, admin)."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
