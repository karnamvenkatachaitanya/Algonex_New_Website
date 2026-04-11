from rest_framework import serializers
from common.serializers import MediaSerializer
from .models import Course, Module, Topic, Skill, Enrollment, CourseFAQ, Testimonial, CourseReview, StudentOutcome


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name"]


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ["id", "title", "description", "order"]


class ModuleSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ["id", "title", "description", "order", "topics"]


class CourseFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseFAQ
        fields = ["id", "question", "answer", "order"]


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ["id", "name", "role", "image", "rating", "text"]


class InstructorSerializer(serializers.Serializer):
    """Lightweight instructor representation for course listings."""
    id = serializers.IntegerField()
    name = serializers.SerializerMethodField()

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email


class CourseReviewSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = CourseReview
        fields = ["id", "student_name", "rating", "text", "created_at"]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or "Anonymous"


class CourseReviewSubmitSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    text = serializers.CharField(required=False, allow_blank=True, default="")


class CourseFAQCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseFAQ
        fields = ["question", "answer", "order"]


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
    modules = ModuleSerializer(many=True, read_only=True)
    faqs = CourseFAQSerializer(many=True, read_only=True)
    testimonials = TestimonialSerializer(many=True, read_only=True)
    reviews = CourseReviewSerializer(many=True, read_only=True)
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

    def get_is_enrolled(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(
                student=request.user, status="active"
            ).exists()
        return False


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating courses (instructor input)."""
    skills = serializers.SlugRelatedField(
        many=True, slug_field="name", queryset=Skill.objects.all(), required=False
    )

    class Meta:
        model = Course
        fields = [
            "name", "description", "image", "banner", "level",
            "prior_knowledge", "duration", "price", "discount",
            "is_trending", "is_published", "skills",
        ]


class ModuleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["title", "description", "order"]


class TopicCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ["title", "description", "order"]


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
