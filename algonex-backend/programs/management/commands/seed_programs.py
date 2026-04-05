from datetime import date, timedelta
from django.core.management.base import BaseCommand
from programs.models import Program


PROGRAMS = [
    {
        "title": "AI/ML Research Fellowship",
        "description": "## About\n\nA 3-month intensive fellowship focused on applied AI/ML research...",
        "program_type": "fellowship",
        "duration": "3 months",
        "stipend": "₹25,000/month",
        "location": "Hyderabad",
        "is_remote": False,
        "eligibility_criteria": "## Requirements\n\n- B.Tech/M.Tech in CS, ECE, or related fields\n- Strong Python skills\n- Basic understanding of ML concepts",
        "min_degree_level": "bachelors",
        "eligible_branches": "CSE, ECE, IT, AI&ML",
        "capacity": 15,
        "is_published": True,
        "is_featured": True,
    },
    {
        "title": "Full-Stack Development Internship",
        "description": "## About\n\nA 6-week hands-on internship building real-world web applications...",
        "program_type": "internship",
        "duration": "6 weeks",
        "stipend": "₹15,000/month",
        "location": "Remote",
        "is_remote": True,
        "eligibility_criteria": "## Requirements\n\n- Currently pursuing B.Tech or equivalent\n- Basic HTML/CSS/JS knowledge\n- Enthusiasm to learn React and Django",
        "min_degree_level": "bachelors",
        "eligible_branches": "CSE, IT, MCA",
        "capacity": 30,
        "is_published": True,
        "is_featured": True,
    },
    {
        "title": "Cloud & DevOps Fellowship",
        "description": "## About\n\nLearn cloud infrastructure, CI/CD, and DevOps practices...",
        "program_type": "fellowship",
        "duration": "4 months",
        "stipend": "₹20,000/month",
        "location": "Hyderabad",
        "is_remote": False,
        "eligibility_criteria": "## Requirements\n\n- B.Tech in CS/IT or equivalent\n- Linux basics\n- Familiarity with at least one programming language",
        "min_degree_level": "bachelors",
        "eligible_branches": "CSE, IT, ECE",
        "capacity": 10,
        "is_published": True,
        "is_featured": False,
    },
    {
        "title": "Data Analytics Internship",
        "description": "## About\n\nPractical data analytics internship covering SQL, Python, and visualization...",
        "program_type": "internship",
        "duration": "8 weeks",
        "stipend": "₹10,000/month",
        "location": "Remote",
        "is_remote": True,
        "eligibility_criteria": "## Requirements\n\n- Any degree stream welcome\n- Basic Excel skills\n- Interest in data and analytics",
        "eligible_branches": "Any",
        "capacity": 50,
        "is_published": True,
        "is_featured": False,
    },
]


class Command(BaseCommand):
    help = "Seed sample fellowship and internship programs"

    def handle(self, *args, **options):
        created = 0
        for data in PROGRAMS:
            data["application_deadline"] = date.today() + timedelta(days=45)
            data["start_date"] = date.today() + timedelta(days=60)
            data["end_date"] = date.today() + timedelta(days=60 + 90)

            if not Program.objects.filter(title=data["title"]).exists():
                Program.objects.create(**data)
                created += 1
                self.stdout.write(f"  Created: {data['title']}")
            else:
                self.stdout.write(f"  Skipped (exists): {data['title']}")

        self.stdout.write(self.style.SUCCESS(f"\nDone. Created {created} programs."))
