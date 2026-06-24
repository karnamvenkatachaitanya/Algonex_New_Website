from rest_framework import serializers
from common.serializers import MediaSerializer
from .models import Course, Tag, Enrollment, FAQ, Feedback, StudentOutcome, Certificate


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "category"]


SkillSerializer = TagSerializer





class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ["id", "question", "answer", "order"]


CourseFAQSerializer = FAQSerializer


class FeedbackSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        fields = ["id", "student_name", "name", "role", "image", "rating", "text", "created_at"]

    def get_student_name(self, obj):
        if obj.student:
            return f"{obj.student.first_name} {obj.student.last_name}".strip() or "Anonymous"
        return obj.name or "Anonymous"


CourseReviewSerializer = FeedbackSerializer


class CourseReviewSubmitSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    text = serializers.CharField(required=False, allow_blank=True, default="")


class FAQCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ["question", "answer", "order"]


CourseFAQCreateSerializer = FAQCreateSerializer


class InstructorSerializer(serializers.Serializer):
    """Lightweight instructor representation for course listings."""
    id = serializers.IntegerField()
    name = serializers.SerializerMethodField()

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email


class CourseListSerializer(serializers.ModelSerializer):
    """Serializer for course list view — lightweight."""
    instructor = InstructorSerializer(read_only=True)
    skills = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    student_count = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    media = MediaSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            "id", "name", "slug", "description", "image", "level",
            "duration", "price", "discount", "is_trending",
            "instructor", "skills", "student_count",
            "average_rating", "review_count", "media",
        ]


class CourseDetailSerializer(serializers.ModelSerializer):
    """Serializer for course detail view — full data."""
    instructor = InstructorSerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    modules = serializers.SerializerMethodField()
    faqs = FAQSerializer(many=True, read_only=True)
    testimonials = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    media = MediaSerializer(many=True, read_only=True)
    student_count = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "name", "slug", "description", "image", "banner",
            "level", "prior_knowledge", "duration", "price", "discount",
            "is_trending", "is_published", "instructor", "skills",
            "modules", "faqs", "testimonials", "reviews", "media",
            "student_count", "average_rating", "review_count", "is_enrolled",
            "created_at", "updated_at",
        ]

    def get_modules(self, obj):
        return obj.curriculum

    def get_is_enrolled(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(
                student=request.user, status="active"
            ).exists()
        return False

    def get_testimonials(self, obj):
        feedbacks = obj.feedbacks.filter(student__isnull=True, is_approved=True)
        return FeedbackSerializer(feedbacks, many=True).data

    def get_reviews(self, obj):
        feedbacks = obj.feedbacks.filter(student__isnull=False, is_approved=True)
        return FeedbackSerializer(feedbacks, many=True).data


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating courses (instructor input)."""
    skills = serializers.SlugRelatedField(
        many=True, slug_field="name", queryset=Tag.objects.all(), required=False
    )

    class Meta:
        model = Course
        fields = [
            "name", "description", "image", "banner", "level",
            "prior_knowledge", "duration", "price", "discount",
            "is_trending", "is_published", "skills",
            "course_type", "curriculum", "stipend", "location",
            "is_remote", "eligibility_criteria", "min_degree_level",
            "eligible_branches", "application_deadline", "start_date",
            "end_date", "capacity", "is_featured",
        ]





class EnrollmentCourseSerializer(serializers.ModelSerializer):
    """Lightweight course info for enrollment listings."""

    class Meta:
        model = Course
        fields = ["id", "name", "slug", "image", "level", "duration"]


class EnrollmentSerializer(serializers.ModelSerializer):
    course = EnrollmentCourseSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "course", "enrolled_at", "status"]


class OutcomeCourseSerializer(serializers.ModelSerializer):
    """Lightweight course info for outcome listings."""
    class Meta:
        model = Course
        fields = ["name", "slug"]


class StudentOutcomeSerializer(serializers.ModelSerializer):
    course = OutcomeCourseSerializer(read_only=True)

    class Meta:
        model = StudentOutcome
        fields = [
            "id", "student_name", "achievement_type", "company_name",
            "role", "package_range", "course", "achieved_at",
        ]


class CertificateSerializer(serializers.ModelSerializer):
    worked_tools = serializers.CharField(source="worked_tools_text", read_only=True)

    class Meta:
        model = Certificate
        fields = [
            "certificate_id",
            "intern_id",
            "student_name",
            "certificate_type",
            "title",
            "description",
            "worked_tools",
            "badge_text",
            "is_verified",
            "issue_date",
        ]
