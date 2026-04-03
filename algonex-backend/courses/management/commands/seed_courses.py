"""
Management command to seed the database with the 4 courses from constant.js.
Usage: python manage.py seed_courses
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import Course, Module, Topic, Skill, CourseFAQ, Testimonial

User = get_user_model()

SEED_COURSES = [
    {
        "name": "Python Full Stack",
        "description": "Master Python for full-stack web development with Django and React.",
        "image": "https://www.emexotechnologies.com/wp-content/uploads/2021/01/python-training-emexo.png",
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
    },
    {
        "name": "MERN Stack",
        "description": "Build modern web applications with MongoDB, Express, React, and Node.js.",
        "image": "https://www.emexotechnologies.com/wp-content/uploads/2021/01/python-training-emexo.png",
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
    },
    {
        "name": "Data Analyst",
        "description": "Learn data analysis with Python, SQL, and visualization tools.",
        "image": "https://www.emexotechnologies.com/wp-content/uploads/2021/01/python-training-emexo.png",
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
    },
    {
        "name": "Java Full Stack",
        "description": "Master Java for enterprise full-stack development with Spring Boot and Angular.",
        "image": "https://www.emexotechnologies.com/wp-content/uploads/2021/01/python-training-emexo.png",
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

        for course_data in SEED_COURSES:
            skills_data = course_data.pop("skills")
            modules_data = course_data.pop("modules")

            course, created = Course.objects.get_or_create(
                name=course_data["name"],
                defaults={**course_data, "instructor": instructor, "is_published": True},
            )

            if not created:
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

            self.stdout.write(self.style.SUCCESS(f"  Created: {course.name}"))

        self.stdout.write(self.style.SUCCESS("Seed complete!"))
