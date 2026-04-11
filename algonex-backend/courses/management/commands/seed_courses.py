"""
Management command to seed the database with the 4 courses from constant.js.
Usage: python manage.py seed_courses
"""
from datetime import date, timedelta
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from common.models import Media
from courses.models import Course, Module, Topic, Skill, CourseFAQ, Testimonial, StudentOutcome

User = get_user_model()

SEED_COURSES = [
    {
        "name": "Python Full Stack",
        "description": "Master Python for full-stack web development with Django and React.",
        "image": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&auto=format&fit=crop",
        "level": "beginner",
        "prior_knowledge": "No prior knowledge required",
        "duration": "10 days",
        "price": "1000.00",
        "discount": 10,
        "is_trending": True,
        "skills": ["Python", "Data Analysis", "Data Visualization", "SQL", "Pandas", "NumPy", "Django", "React"],
        "modules": [
            {"title": "Module 1: Python Basics", "description": "Introduction to Python programming", "topics": [
                "Variables & Data Types", "Control Flow", "Functions", "OOP Basics",
            ]},
            {"title": "Module 2: Web Development", "description": "Building web apps with Django", "topics": [
                "Django Setup", "Models & ORM", "Views & URLs", "Templates",
            ]},
        ],
        "media": [
            {"image": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&auto=format&fit=crop", "caption": "Python programming"},
            {"image": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&auto=format&fit=crop", "caption": "Code editor in action"},
            {"image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop", "caption": "Hands-on coding session"},
        ],
    },
    {
        "name": "MERN Stack",
        "description": "Build modern web applications with MongoDB, Express, React, and Node.js.",
        "image": "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&auto=format&fit=crop",
        "level": "intermediate",
        "prior_knowledge": "Basic JavaScript knowledge",
        "duration": "15 days",
        "price": "1500.00",
        "discount": 15,
        "is_trending": True,
        "skills": ["JavaScript", "React", "Node.js", "Express", "MongoDB", "REST APIs"],
        "modules": [
            {"title": "Module 1: JavaScript Advanced", "description": "Advanced JS concepts", "topics": [
                "ES6+ Features", "Async/Await", "Closures", "Prototypes",
            ]},
            {"title": "Module 2: React", "description": "Frontend with React", "topics": [
                "Components", "Hooks", "State Management", "Routing",
            ]},
        ],
        "media": [
            {"image": "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&auto=format&fit=crop", "caption": "JavaScript development"},
            {"image": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop", "caption": "React component architecture"},
            {"image": "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=600&auto=format&fit=crop", "caption": "Node.js backend development"},
        ],
    },
    {
        "name": "Data Analyst",
        "description": "Learn data analysis with Python, SQL, and visualization tools.",
        "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop",
        "level": "beginner",
        "prior_knowledge": "Basic math knowledge",
        "duration": "12 days",
        "price": "1200.00",
        "discount": 10,
        "is_trending": False,
        "skills": ["Python", "SQL", "Pandas", "Matplotlib", "Seaborn", "Excel", "Tableau"],
        "modules": [
            {"title": "Module 1: Python for Data", "description": "Python fundamentals for data analysis", "topics": [
                "NumPy Basics", "Pandas DataFrames", "Data Cleaning", "Aggregation",
            ]},
            {"title": "Module 2: Visualization", "description": "Data visualization techniques", "topics": [
                "Matplotlib Basics", "Seaborn Plots", "Dashboard Design", "Storytelling with Data",
            ]},
        ],
        "media": [
            {"image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop", "caption": "Data visualization dashboard"},
            {"image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop", "caption": "Analytics and charts"},
            {"image": "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&auto=format&fit=crop", "caption": "Working with data"},
        ],
    },
    {
        "name": "Java Full Stack",
        "description": "Master Java for enterprise full-stack development with Spring Boot and Angular.",
        "image": "https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=600&auto=format&fit=crop",
        "level": "intermediate",
        "prior_knowledge": "Basic programming knowledge",
        "duration": "20 days",
        "price": "2000.00",
        "discount": 20,
        "is_trending": True,
        "skills": ["Java", "Spring Boot", "Angular", "MySQL", "REST APIs", "Microservices"],
        "modules": [
            {"title": "Module 1: Java Fundamentals", "description": "Core Java concepts", "topics": [
                "OOP", "Collections", "Streams", "Exception Handling",
            ]},
            {"title": "Module 2: Spring Boot", "description": "Backend with Spring", "topics": [
                "Spring MVC", "JPA/Hibernate", "Security", "REST APIs",
            ]},
        ],
        "media": [
            {"image": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop", "caption": "Enterprise development"},
            {"image": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop", "caption": "Team collaboration"},
            {"image": "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop", "caption": "Classroom training session"},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed the database with sample courses from constant.js"

    def handle(self, *args, **options):
        # Create a default instructor if none exists
        instructor, _ = User.objects.get_or_create(
            email="instructor@algonex.com",
            defaults={
                "first_name": "Algonex",
                "last_name": "Instructor",
                "role": "instructor",
                "username": "algonex_instructor",
            },
        )
        if not instructor.has_usable_password():
            instructor.set_password("instructor123")
            instructor.save()

        course_ct = ContentType.objects.get_for_model(Course)

        for course_data in SEED_COURSES:
            skills_data = course_data.pop("skills")
            modules_data = course_data.pop("modules")
            media_data = course_data.pop("media", [])

            course, created = Course.objects.get_or_create(
                name=course_data["name"],
                defaults={**course_data, "instructor": instructor, "is_published": True},
            )

            if not created:
                # Add media if none exists yet
                if media_data and not Media.objects.filter(content_type=course_ct, object_id=course.pk).exists():
                    for i, m in enumerate(media_data):
                        Media.objects.create(
                            content_type=course_ct,
                            object_id=course.pk,
                            image=m["image"],
                            caption=m.get("caption", ""),
                            order=i,
                        )
                    self.stdout.write(f"  Added {len(media_data)} media to: {course.name}")
                else:
                    self.stdout.write(f"  Skipped (exists): {course.name}")
                continue

            # Add skills
            for skill_name in skills_data:
                skill, _ = Skill.objects.get_or_create(name=skill_name)
                course.skills.add(skill)

            # Add modules and topics
            for i, mod_data in enumerate(modules_data):
                topics_data = mod_data.pop("topics")
                module = Module.objects.create(
                    course=course, title=mod_data["title"],
                    description=mod_data["description"], order=i + 1,
                )
                for j, topic_title in enumerate(topics_data):
                    Topic.objects.create(
                        module=module, title=topic_title,
                        description=f"Learn about {topic_title}", order=j + 1,
                    )

            # Add media gallery images
            for i, m in enumerate(media_data):
                Media.objects.create(
                    content_type=course_ct,
                    object_id=course.pk,
                    image=m["image"],
                    caption=m.get("caption", ""),
                    order=i,
                )

            self.stdout.write(self.style.SUCCESS(f"  Created: {course.name} ({len(media_data)} media)"))

        self.stdout.write(self.style.SUCCESS("Seed complete!"))

        # --- Student Outcomes ---
        outcome_data = [
            {"student_name": "Rahul S.", "achievement_type": "placed", "company_name": "Infosys", "role": "Full Stack Developer", "package_range": "6-8 LPA", "days_ago": 3},
            {"student_name": "Priya M.", "achievement_type": "placed", "company_name": "TCS", "role": "Backend Developer", "package_range": "6-8 LPA", "days_ago": 5},
            {"student_name": "Vikram D.", "achievement_type": "promoted", "company_name": "Accenture", "role": "Senior React Developer", "package_range": "10-12 LPA", "days_ago": 7},
            {"student_name": "Sneha R.", "achievement_type": "placed", "company_name": "Deloitte", "role": "Data Analyst", "package_range": "8-10 LPA", "days_ago": 2},
            {"student_name": "Arjun P.", "achievement_type": "placed", "company_name": "Amazon", "role": "Business Analyst", "package_range": "12-15 LPA", "days_ago": 10},
            {"student_name": "Divya L.", "achievement_type": "freelancing", "company_name": "", "role": "Python Freelancer", "package_range": "", "days_ago": 1},
            {"student_name": "Karthik N.", "achievement_type": "project_launched", "company_name": "", "role": "", "package_range": "", "days_ago": 4},
            {"student_name": "Meera T.", "achievement_type": "placed", "company_name": "Freshworks", "role": "Backend Engineer", "package_range": "8-10 LPA", "days_ago": 6},
            {"student_name": "Sanjay V.", "achievement_type": "placed", "company_name": "Flipkart", "role": "Frontend Engineer", "package_range": "10-12 LPA", "days_ago": 8},
            {"student_name": "Ananya K.", "achievement_type": "placed", "company_name": "Wipro", "role": "Frontend Developer", "package_range": "5-6 LPA", "days_ago": 12},
        ]

        courses_for_outcomes = list(Course.objects.filter(is_published=True)[:4])
        created_outcomes = 0
        for i, data in enumerate(outcome_data):
            days_ago = data.pop("days_ago")
            course = courses_for_outcomes[i % len(courses_for_outcomes)] if courses_for_outcomes else None
            if course:
                _, created = StudentOutcome.objects.get_or_create(
                    student_name=data["student_name"],
                    course=course,
                    defaults={
                        **data,
                        "achieved_at": date.today() - timedelta(days=days_ago),
                        "is_published": True,
                    },
                )
                if created:
                    created_outcomes += 1
        self.stdout.write(f"Created {created_outcomes} student outcomes.")
