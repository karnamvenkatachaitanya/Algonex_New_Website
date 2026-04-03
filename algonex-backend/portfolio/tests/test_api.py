from django.test import TestCase
from rest_framework.test import APIClient
from portfolio.models import CaseStudy, TechTag, Screenshot


class TestCaseStudyAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.case_study = CaseStudy.objects.create(
            title="EduFlow LMS",
            slug="eduflow-lms",
            client_name="State University",
            summary="Learning management system",
            problem="University managed courses through spreadsheets.",
            solution="Built a full LMS with course management.",
            results="50% reduction in admin overhead.",
            industry="edtech",
            is_published=True,
            published_at="2026-01-15",
        )
        tag1 = TechTag.objects.create(name="React")
        tag2 = TechTag.objects.create(name="Django")
        self.case_study.tech_tags.add(tag1, tag2)
        Screenshot.objects.create(
            case_study=self.case_study, image="test.jpg", caption="Dashboard", order=1
        )

    def test_list_published_case_studies(self):
        response = self.client.get("/api/v1/portfolio/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["data"]["results"]), 1)
        self.assertIn("tech_tags", response.data["data"]["results"][0])

    def test_unpublished_hidden(self):
        CaseStudy.objects.create(
            title="Draft", slug="draft", client_name="X",
            summary="S", problem="P", solution="S", results="R",
            industry="fintech", is_published=False,
        )
        response = self.client.get("/api/v1/portfolio/")
        self.assertEqual(len(response.data["data"]["results"]), 1)

    def test_get_case_study_detail(self):
        response = self.client.get("/api/v1/portfolio/eduflow-lms/")
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(data["title"], "EduFlow LMS")
        self.assertIn("problem", data)
        self.assertIn("solution", data)
        self.assertIn("results", data)
        self.assertIn("screenshots", data)
        self.assertEqual(len(data["screenshots"]), 1)
        self.assertEqual(len(data["tech_tags"]), 2)

    def test_filter_by_industry(self):
        response = self.client.get("/api/v1/portfolio/?industry=edtech")
        self.assertEqual(len(response.data["data"]["results"]), 1)

    def test_filter_by_tech(self):
        response = self.client.get("/api/v1/portfolio/?tech=React")
        self.assertEqual(len(response.data["data"]["results"]), 1)

        response = self.client.get("/api/v1/portfolio/?tech=Vue")
        self.assertEqual(len(response.data["data"]["results"]), 0)

    def test_nonexistent_returns_404(self):
        response = self.client.get("/api/v1/portfolio/nonexistent/")
        self.assertEqual(response.status_code, 404)
