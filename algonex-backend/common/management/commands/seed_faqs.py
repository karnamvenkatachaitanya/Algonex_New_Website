"""
Seed the database with general FAQs.
Usage: python manage.py seed_faqs
"""
from django.core.management.base import BaseCommand
from common.models import GeneralFAQ

FAQS = [
    {
        "question": "How do I know which course is right for me?",
        "answer": "Take our 60-second skill assessment quiz or speak with a training advisor. We'll recommend a program based on your background, experience level, and career goals.",
    },
    {
        "question": "Do I need prior coding experience to enroll?",
        "answer": "Not at all. Our beginner-friendly courses start from the fundamentals and progress step by step. Many of our successful trainees started with zero coding experience.",
    },
    {
        "question": "What kind of placement support does Algonex provide?",
        "answer": "We offer resume building, mock interviews, portfolio reviews, and direct referrals to our 50+ hiring partners. Our placement team works with you until you land a role.",
    },
    {
        "question": "How long are the training programs?",
        "answer": "Programs range from 8 to 14 weeks depending on the course. Each includes live sessions, hands-on projects, and dedicated mentor support throughout.",
    },
    {
        "question": "Can I attend classes while working a full-time job?",
        "answer": "Yes. We offer flexible batch timings including weekday evenings and weekend batches designed for working professionals.",
    },
    {
        "question": "What programming languages will I learn?",
        "answer": "It depends on your chosen track. Our Python Full Stack covers Python, Django, and React. MERN Stack covers JavaScript, Node.js, and React. Each course focuses on the most in-demand technologies.",
    },
    {
        "question": "Is there a free demo class available?",
        "answer": "Yes! We offer free demo sessions for every course. Contact us or visit the course page to book your spot.",
    },
]


class Command(BaseCommand):
    help = "Seed the database with general FAQs"

    def handle(self, *args, **options):
        created_count = 0
        for i, faq_data in enumerate(FAQS):
            _, created = GeneralFAQ.objects.get_or_create(
                question=faq_data["question"],
                defaults={"answer": faq_data["answer"], "order": i, "is_active": True},
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {created_count} FAQs ({len(FAQS) - created_count} already existed)"))
