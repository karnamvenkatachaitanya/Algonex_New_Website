from django.core.management.base import BaseCommand
from courses.models import Course, Skill
from showcase.models import AlumniProfile, StudentProject


class Command(BaseCommand):
    help = "Seed alumni profiles and student projects"

    def handle(self, *args, **options):
        courses = list(Course.objects.filter(is_published=True)[:4])
        if not courses:
            self.stderr.write("No published courses found. Run seed_courses first.")
            return

        skills = {s.name: s for s in Skill.objects.all()}

        # --- Alumni Profiles ---
        alumni_data = [
            {"name": "Priya M.", "course": 0, "batch_year": 2025, "current_company": "TCS", "current_role": "Backend Developer", "package_range": "6-8 LPA", "short_quote": "Algonex gave me the skills to land my dream job.", "is_featured": True},
            {"name": "Rahul S.", "course": 0, "batch_year": 2025, "current_company": "Infosys", "current_role": "Full Stack Developer", "package_range": "5-7 LPA", "short_quote": "The hands-on projects made all the difference.", "is_featured": True},
            {"name": "Ananya K.", "course": 1, "batch_year": 2025, "current_company": "Wipro", "current_role": "Frontend Developer", "package_range": "5-6 LPA", "short_quote": "I went from zero coding to employed in 4 months.", "is_featured": True},
            {"name": "Vikram D.", "course": 1, "batch_year": 2024, "current_company": "Accenture", "current_role": "React Developer", "package_range": "7-9 LPA", "short_quote": "Best investment in my career.", "is_featured": False},
            {"name": "Sneha R.", "course": 2, "batch_year": 2025, "current_company": "Deloitte", "current_role": "Data Analyst", "package_range": "8-10 LPA", "short_quote": "The analytics curriculum is world-class.", "is_featured": True},
            {"name": "Arjun P.", "course": 2, "batch_year": 2024, "current_company": "Amazon", "current_role": "Business Analyst", "package_range": "12-15 LPA", "short_quote": "Algonex helped me transition from ops to analytics.", "is_featured": True},
            {"name": "Divya L.", "course": 0, "batch_year": 2024, "current_company": "Zoho", "current_role": "Python Developer", "package_range": "6-8 LPA", "short_quote": "The mentorship was incredible.", "is_featured": False},
            {"name": "Karthik N.", "course": 3, "batch_year": 2025, "current_company": "Cognizant", "current_role": "Java Developer", "package_range": "5-7 LPA", "short_quote": "Solid foundation in enterprise development.", "is_featured": False},
            {"name": "Meera T.", "course": 0, "batch_year": 2025, "current_company": "Freshworks", "current_role": "Backend Engineer", "package_range": "8-10 LPA", "short_quote": "From career switcher to engineer in 3 months.", "is_featured": True},
            {"name": "Sanjay V.", "course": 1, "batch_year": 2024, "current_company": "Flipkart", "current_role": "Frontend Engineer", "package_range": "10-12 LPA", "short_quote": "The MERN curriculum is spot-on for the industry.", "is_featured": True},
        ]

        created_alumni = 0
        for data in alumni_data:
            course_idx = data.pop("course")
            if course_idx < len(courses):
                _, created = AlumniProfile.objects.get_or_create(
                    name=data["name"], course=courses[course_idx],
                    defaults={**data, "is_published": True},
                )
                if created:
                    created_alumni += 1
        self.stdout.write(f"Created {created_alumni} alumni profiles.")

        # --- Student Projects ---
        project_data = [
            {"title": "ShopEasy E-Commerce", "description": "A full-stack e-commerce platform with cart, checkout, payment integration, and admin dashboard.", "student_name": "Rahul S.", "course": 0, "batch_year": 2025, "demo_url": "https://shopeasy-demo.example.com", "github_url": "https://github.com/example/shopeasy", "tags": ["Python", "Django", "React", "PostgreSQL"], "is_featured": True},
            {"title": "TaskFlow Project Manager", "description": "Real-time project management tool with Kanban boards, team chat, and progress tracking.", "student_name": "Ananya K.", "course": 1, "batch_year": 2025, "demo_url": "https://taskflow-demo.example.com", "github_url": "https://github.com/example/taskflow", "tags": ["React", "Node.js", "MongoDB", "Socket.io"], "is_featured": True},
            {"title": "Sales Analytics Dashboard", "description": "Interactive dashboard for sales data visualization with predictive analytics and export features.", "student_name": "Sneha R.", "course": 2, "batch_year": 2025, "demo_url": "https://sales-dash.example.com", "tags": ["Python", "Pandas", "Plotly", "SQL"], "is_featured": True},
            {"title": "HealthTrack API", "description": "RESTful API for health tracking with JWT auth, data validation, and comprehensive API docs.", "student_name": "Karthik N.", "course": 3, "batch_year": 2025, "github_url": "https://github.com/example/healthtrack", "tags": ["Java", "Spring Boot", "PostgreSQL"], "is_featured": False},
            {"title": "DevConnect Social", "description": "Developer networking platform with profiles, posts, messaging, and project showcasing.", "student_name": "Vikram D.", "course": 1, "batch_year": 2024, "demo_url": "https://devconnect.example.com", "github_url": "https://github.com/example/devconnect", "tags": ["React", "Node.js", "MongoDB"], "is_featured": True},
        ]

        created_projects = 0
        for data in project_data:
            course_idx = data.pop("course")
            tags = data.pop("tags", [])
            if course_idx < len(courses):
                project, created = StudentProject.objects.get_or_create(
                    title=data["title"],
                    defaults={
                        **data,
                        "course": courses[course_idx],
                        "thumbnail": "projects/thumbnails/placeholder.jpg",
                        "is_published": True,
                    },
                )
                if created:
                    for tag_name in tags:
                        if tag_name in skills:
                            project.tech_tags.add(skills[tag_name])
                    created_projects += 1
        self.stdout.write(f"Created {created_projects} student projects.")
        self.stdout.write(self.style.SUCCESS("Showcase seed data complete."))
