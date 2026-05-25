from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from common.models import Media
from events.models import Event


EVENTS = [
    {
        "title": "Full Stack Web Development Workshop",
        "summary": "Build a complete MERN application from scratch in a single day — backend API, database, and React frontend.",
        "description": """## What You'll Build

A **complete MERN application** from scratch in a single day — backend API, database, and React frontend.

### Topics Covered

- **React 19** — Components, hooks, state management
- **Node.js & Express** — REST API development
- **MongoDB** — Schema design and CRUD operations
- **Authentication** — JWT-based login system

### Prerequisites

- Basic HTML/CSS knowledge
- A laptop with Node.js installed
- GitHub account

### What to Bring

1. Your laptop (fully charged)
2. A notebook for quick sketches
3. Enthusiasm to build!

> "The best way to learn full stack is to build a real project end-to-end in one sitting." — Algonex Instructors

---

**Lunch and refreshments** will be provided. Certificate of completion for all participants.""",
        "event_type": "workshop",
        "location": "Algonex Campus, Bangalore",
        "capacity": 30,
        "days_from_now": 12,
        "duration_hours": 6,
        "media": [
            {"image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop", "caption": "Workshop venue"},
            {"image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop", "caption": "Hands-on coding"},
            {"image": "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop", "caption": "Group learning session"},
        ],
    },
    {
        "title": "AI & Machine Learning Masterclass",
        "summary": "Deep dive into neural networks, NLP, and computer vision with a senior ML engineer from Google.",
        "description": """## Deep Dive into AI & ML

Join **Dr. Priya Nair**, Senior ML Engineer at Google, for an intensive masterclass covering the fundamentals and cutting-edge techniques in artificial intelligence.

### Agenda

| Time | Topic |
|------|-------|
| 2:00 PM | Introduction to Neural Networks |
| 2:45 PM | Hands-on: Building a CNN with PyTorch |
| 3:30 PM | Break |
| 3:45 PM | NLP & Transformer Architecture |
| 4:30 PM | Computer Vision Applications |
| 5:00 PM | Q&A Session |

### What You'll Learn

- How **neural networks** actually work (not just the theory)
- Building image classifiers with **Convolutional Neural Networks**
- Understanding **Transformers** — the architecture behind ChatGPT
- Real-world applications in **healthcare, fintech, and e-commerce**

### Requirements

- Python basics (variables, functions, loops)
- Jupyter Notebook installed
- No prior ML experience needed

> This is an online event. The Zoom link will be shared with registered participants 24 hours before the event.""",
        "event_type": "webinar",
        "location": "Online (Zoom)",
        "meeting_link": "https://zoom.us/j/example",
        "capacity": 100,
        "days_from_now": 19,
        "duration_hours": 3,
        "media": [
            {"image": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop", "caption": "AI and robotics"},
            {"image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop", "caption": "Machine learning models"},
            {"image": "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&auto=format&fit=crop", "caption": "Neural network visualization"},
        ],
    },
    {
        "title": "Hackathon: Build for Impact",
        "summary": "48-hour hackathon to build solutions for real social challenges. ₹1L prize pool. Teams of 2-4.",
        "description": """## 48-Hour Hackathon

Build solutions for **real social challenges** and compete for a prize pool of **₹1,00,000**!

### Themes

Choose one of these tracks:

1. **Healthcare** — Improving access to medical services in rural areas
2. **Education** — Making quality education accessible to underserved communities
3. **Environment** — Tools for climate monitoring and sustainable living
4. **Accessibility** — Technology for people with disabilities

### Prizes

| Place | Prize |
|-------|-------|
| 1st | ₹50,000 + Internship offer |
| 2nd | ₹30,000 + Course vouchers |
| 3rd | ₹20,000 + Swag kit |
| Best UI | Special mention + ₹10,000 |

### Rules

- Teams of **2-4 members** (solo participants will be matched)
- All code must be written during the hackathon
- Use any tech stack you want
- Final submission includes a **3-minute demo video**

### Schedule

- **Day 1 (9 AM):** Kickoff, team formation, mentorship sessions
- **Day 1 (9 PM):** Check-in #1
- **Day 2 (9 AM):** Check-in #2, final sprint
- **Day 2 (6 PM):** Submissions close
- **Day 2 (7 PM):** Demos & judging
- **Day 2 (9 PM):** Winners announced!

> *"Last year's winning team built a patient tracking app now used by 3 NGOs across Karnataka."*

**Meals, snacks, and unlimited coffee** provided throughout the event.""",
        "event_type": "hackathon",
        "location": "Algonex Campus, Bangalore",
        "capacity": 50,
        "days_from_now": 30,
        "duration_hours": 48,
        "media": [
            {"image": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop", "caption": "Hackathon in progress"},
            {"image": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop", "caption": "Team collaboration"},
            {"image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&auto=format&fit=crop", "caption": "Final presentations"},
        ],
    },
    {
        "title": "Cloud Computing & DevOps Bootcamp",
        "summary": "Learn AWS, Docker, and Kubernetes through hands-on labs. Deploy a containerized app to the cloud by end of day.",
        "description": """## From Zero to Cloud in One Day

Learn **AWS, Docker, and Kubernetes** through hands-on labs. By the end of this bootcamp, you'll deploy a containerized application to the cloud with a CI/CD pipeline.

### What You'll Learn

- **Docker** — Containers, images, Docker Compose
- **AWS** — EC2, S3, RDS, and IAM basics
- **Kubernetes** — Pods, services, deployments
- **CI/CD** — GitHub Actions pipeline from commit to production

### Hands-on Labs

```bash
# You'll run commands like these by the end of the day:
docker build -t myapp .
docker push myapp:latest
kubectl apply -f deployment.yaml
```

### Who Should Attend

- Backend developers wanting to learn DevOps
- Students preparing for cloud certifications
- Anyone curious about how modern apps are deployed

### Prerequisites

- Basic Linux command line knowledge
- GitHub account
- AWS free tier account (we'll help you set one up)

**Certificate:** AWS Cloud Practitioner preparation guide included for all attendees.""",
        "event_type": "workshop",
        "location": "Algonex Campus, Bangalore",
        "capacity": 40,
        "days_from_now": 37,
        "duration_hours": 5,
        "media": [
            {"image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop", "caption": "Cloud infrastructure"},
            {"image": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&auto=format&fit=crop", "caption": "Container orchestration"},
            {"image": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop", "caption": "Server room"},
        ],
    },
    {
        "title": "Tech Career Fair 2026",
        "summary": "Meet hiring managers from 20+ top tech companies. On-spot interviews available for qualified candidates.",
        "description": """## Meet 20+ Top Tech Companies

The biggest tech hiring event in Bangalore this quarter. **On-spot interviews** available for qualified candidates.

### Participating Companies

- **Product Companies:** Amazon, Flipkart, Razorpay, Swiggy, Zerodha
- **Service Companies:** TCS, Infosys, Wipro, HCL, Tech Mahindra
- **Startups:** 10+ funded startups hiring across all roles
- **Consulting:** Deloitte, Accenture, PwC

### Roles Available

| Domain | Roles |
|--------|-------|
| Engineering | Frontend, Backend, Full Stack, DevOps, Data |
| Design | UI/UX, Product Design |
| Product | Product Manager, Business Analyst |
| Data | Data Analyst, Data Engineer, ML Engineer |

### What to Bring

1. **Multiple copies of your resume** (at least 10)
2. Your **portfolio/GitHub** link
3. **Government ID** for entry
4. Business casual attire recommended

### Schedule

- **9:00 AM** — Registration & welcome kit
- **9:30 AM** — Keynote: "Tech Hiring Trends in 2026"
- **10:00 AM - 4:00 PM** — Company booths & interviews
- **4:00 PM** — Networking session
- **5:00 PM** — Wrap-up

> **Pro tip:** Research the companies you're interested in beforehand. Recruiters love candidates who know what the company does.

**Free entry** for all Algonex students and alumni. Others: ₹199 registration fee.""",
        "event_type": "meetup",
        "location": "Algonex Campus, Bangalore",
        "capacity": 200,
        "days_from_now": 45,
        "duration_hours": 8,
        "media": [
            {"image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop", "caption": "Career fair networking"},
            {"image": "https://images.unsplash.com/photo-1559223607-a43c990c692c?w=600&auto=format&fit=crop", "caption": "Company booths"},
            {"image": "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&auto=format&fit=crop", "caption": "Interview sessions"},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed sample events for development"

    def handle(self, *args, **options):
        event_ct = ContentType.objects.get_for_model(Event)
        created = 0
        updated = 0
        for data in EVENTS:
            days = data.pop("days_from_now")
            hours = data.pop("duration_hours")
            media_data = data.pop("media", [])
            start = timezone.now() + timedelta(days=days)
            end = start + timedelta(hours=hours)

            event, was_created = Event.objects.get_or_create(
                title=data["title"],
                defaults={
                    **data,
                    "start_date": start,
                    "end_date": end,
                    "is_published": True,
                },
            )
            if was_created:
                created += 1
                # Add media gallery images
                for i, m in enumerate(media_data):
                    Media.objects.create(
                        content_type=event_ct,
                        object_id=event.pk,
                        image=m["image"],
                        caption=m.get("caption", ""),
                        order=i,
                    )
            else:
                # Update existing events
                event.summary = data.get("summary", "")
                event.description = data["description"]
                event.save(update_fields=["summary", "description"])
                # Add media if none exists
                if not Media.objects.filter(content_type=event_ct, object_id=event.pk).exists():
                    for i, m in enumerate(media_data):
                        Media.objects.create(
                            content_type=event_ct,
                            object_id=event.pk,
                            image=m["image"],
                            caption=m.get("caption", ""),
                            order=i,
                        )
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new, updated {updated} existing"))
