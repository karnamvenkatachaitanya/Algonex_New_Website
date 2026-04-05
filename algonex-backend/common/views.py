from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Avg
from django.contrib.auth import get_user_model

User = get_user_model()


class ActiveBannerView(APIView):
    """
    GET /api/v1/banner/
    Returns the currently active site banner (if any).
    """

    permission_classes = [AllowAny]

    def get(self, request):
        from .models import SiteBanner
        banner = SiteBanner.objects.filter(is_active=True).first()
        if not banner:
            return Response({"status": "success", "data": None})
        return Response({
            "status": "success",
            "data": {
                "text": banner.text,
                "link": banner.link,
                "bg_color": banner.bg_color,
                "text_color": banner.text_color,
            },
        })


class SearchView(APIView):
    """
    GET /api/v1/search/?q=python
    Searches across courses, events, jobs, and case studies.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query or len(query) < 2:
            return Response({
                "status": "success",
                "data": {"courses": [], "events": [], "jobs": [], "case_studies": []},
            })

        from courses.models import Course
        from events.models import Event
        from careers.models import Job
        from portfolio.models import CaseStudy

        courses = Course.objects.filter(
            is_published=True,
        ).filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        ).values("name", "slug", "level", "image")[:5]

        events = Event.objects.filter(
            is_published=True,
        ).filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        ).values("title", "slug", "event_type", "start_date")[:5]

        jobs = Job.objects.filter(
            is_active=True,
        ).filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        ).values("title", "slug", "department", "job_type")[:5]

        case_studies = CaseStudy.objects.filter(
            is_published=True,
        ).filter(
            Q(title__icontains=query) | Q(summary__icontains=query)
        ).values("title", "slug", "industry")[:5]

        return Response({
            "status": "success",
            "data": {
                "courses": list(courses),
                "events": list(events),
                "jobs": list(jobs),
                "case_studies": list(case_studies),
            },
        })


class AdminStatsView(APIView):
    """
    GET /api/v1/admin/stats/
    Platform-wide statistics for admin dashboard.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response(
                {"status": "error", "error": {"code": "FORBIDDEN", "message": "Admin access required."}},
                status=403,
            )

        from courses.models import Course, Enrollment
        from events.models import Event, Registration
        from careers.models import Job, Application

        users_by_role = {
            "students": User.objects.filter(role="student").count(),
            "instructors": User.objects.filter(role="instructor").count(),
            "admins": User.objects.filter(role="admin").count(),
            "total": User.objects.count(),
        }

        courses_stats = {
            "total": Course.objects.count(),
            "published": Course.objects.filter(is_published=True).count(),
            "total_enrollments": Enrollment.objects.filter(status="active").count(),
        }

        events_stats = {
            "total": Event.objects.count(),
            "published": Event.objects.filter(is_published=True).count(),
            "total_registrations": Registration.objects.filter(status="confirmed").count(),
        }

        careers_stats = {
            "active_jobs": Job.objects.filter(is_active=True).count(),
            "total_applications": Application.objects.count(),
            "pipeline": {
                s: Application.objects.filter(status=s).count()
                for s in ["applied", "reviewed", "interview", "hired", "rejected"]
            },
        }

        return Response({
            "status": "success",
            "data": {
                "users": users_by_role,
                "courses": courses_stats,
                "events": events_stats,
                "careers": careers_stats,
            },
        })
