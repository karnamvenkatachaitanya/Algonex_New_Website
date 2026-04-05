# Algonex Deployment Guide

A complete guide to deploying, developing, and maintaining the Algonex platform on a Hetzner VPS.

---

## Table of Contents

1. [How It All Works](#how-it-all-works)
2. [Architecture Overview](#architecture-overview)
3. [Developer Workflow](#developer-workflow)
4. [First-Time VPS Setup](#first-time-vps-setup)
5. [Deploying Changes](#deploying-changes)
6. [Backups & Recovery](#backups--recovery)
7. [Monitoring](#monitoring)
8. [Rollback](#rollback)
9. [Troubleshooting](#troubleshooting)
10. [Cost Breakdown](#cost-breakdown)

---

## How It All Works

Here's how the Algonex platform runs in production, explained step by step.

### The Big Picture

```
You (developer)
  │
  │  git push
  ▼
GitHub ──────────────────────────────────────────────────
  │  1. GitHub Actions runs your tests
  │  2. If tests pass, builds Docker images
  │  3. Pushes images to GitHub Container Registry (ghcr.io)
  │  4. SSHs into your VPS and tells it to pull new images
  ▼
Hetzner VPS ($5/month) ─────────────────────────────────
  │
  │  Docker Compose runs 3 containers:
  │
  ├── Caddy (reverse proxy)
  │     • Handles HTTPS automatically (free SSL via Let's Encrypt)
  │     • Routes /api/* and /admin/* → Django
  │     • Routes /* → React static files
  │     • You never touch SSL certificates
  │
  ├── Django + Gunicorn (backend API)
  │     • Serves the REST API at /api/v1/
  │     • Runs database migrations on deploy
  │     • Handles auth, courses, events, etc.
  │
  └── PostgreSQL 16 (database)
        • Stores all application data
        • Backed up daily to Backblaze B2 (free)
```

### What Happens When a User Visits Your Site

```
1. User types algonex.com in their browser
2. DNS resolves to your Hetzner VPS IP address
3. Caddy receives the request on port 443 (HTTPS)
   ├── Is it /api/* or /admin/*?
   │     → Forward to Django (Gunicorn on port 8000)
   │     → Django processes the request, talks to PostgreSQL
   │     → Returns JSON response
   └── Is it anything else (/, /about, /courses, etc.)?
         → Serve the React static files (index.html, JS, CSS)
         → React Router handles client-side routing
         → React makes API calls to /api/v1/* for data
```

### What Happens When You Deploy

```
1. You push code to the `main` branch on GitHub
2. GitHub Actions automatically:
   a. Runs backend tests (pytest)
   b. Builds the frontend (npm run build)
   c. Builds Docker images for backend and frontend
   d. Pushes images to ghcr.io (GitHub's container registry)
   e. Waits for you to click "Approve" in GitHub Actions UI
3. After approval, GitHub Actions SSHs into your VPS and runs:
   a. docker compose pull          (downloads new images)
   b. docker compose up -d         (restarts with new images)
   c. python manage.py migrate     (applies any DB changes)
4. Your site is updated. Zero downtime for static files.
```

---

## Architecture Overview

### Production Stack

| Component | Technology | Role |
|-----------|-----------|------|
| Reverse Proxy | Caddy 2 | HTTPS termination, routing, static file serving |
| Backend | Django 5.2 + Gunicorn | REST API, admin panel |
| Frontend | React 19 (pre-built static files) | SPA served by Caddy |
| Database | PostgreSQL 16 | Application data |
| CI/CD | GitHub Actions | Test, build, deploy |
| Image Registry | ghcr.io | Stores Docker images |
| Backups | Backblaze B2 (free tier) | Off-site database + media backups |
| SSL | Let's Encrypt (via Caddy) | Free, auto-renewing HTTPS |

### How the Containers Connect

```
                    ┌─────────────────────────┐
                    │         Caddy            │
                    │   ports: 80, 443         │
                    │                          │
                    │  volumes:                │
                    │   /srv/frontend (React)  │
                    │   /srv/static  (Django)  │
                    │   /srv/media   (uploads) │
                    └─────┬───────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
    ┌──────────────────┐    ┌─────────────────┐
    │  Django/Gunicorn  │    │  React (files)  │
    │  port: 8000       │    │  (no container  │
    │                   │    │   at runtime)   │
    │  volumes:         │    └─────────────────┘
    │   /app/media      │
    │   /app/staticfiles│
    └────────┬──────────┘
             │
             ▼
    ┌──────────────────┐
    │  PostgreSQL 16    │
    │  port: 5432       │
    │                   │
    │  volume:          │
    │   postgres_data   │
    └──────────────────┘
```

**Key insight:** The frontend has no running container in production. It's built once during CI, and the static output (`dist/`) is shared with Caddy via a Docker volume. Caddy serves the files directly — much faster than proxying through a Node.js or nginx container.

### Why Caddy Instead of Nginx?

| Feature | Nginx | Caddy |
|---------|-------|-------|
| SSL certificates | Manual (certbot + cron) | Automatic (built-in) |
| Config lines needed | ~40 | ~15 |
| Certificate renewal | You manage it | Caddy handles it |
| Risk of expired certs | Yes (common cause of outages) | No |
| HTTP/2 | Requires config | Automatic |

For a small team, Caddy eliminates the #1 source of "I forgot to renew the SSL cert" downtime.

---

## Developer Workflow

### Day-to-Day Development (Local)

You develop locally without Docker. The existing dev setup works as before:

**Backend:**
```bash
cd algonex-backend
python3.11 manage.py runserver    # Runs on http://localhost:8000
```

**Frontend:**
```bash
cd algonex-frontend
npm run dev                        # Runs on http://localhost:5173
```

The frontend's Vite dev server proxies API calls to `http://localhost:8000/api/v1`.

### Docker-Based Local Dev (Optional)

If you prefer running everything in Docker locally (matches production more closely):

```bash
make dev    # or: docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

This uses the existing `docker-compose.yml` + `docker-compose.dev.yml` with hot reload.

### Git Branching & Deploy Flow

```
feature-branch
    │
    │  Pull Request → Code Review
    ▼
staging branch ──────────► Auto-deploy to staging.algonex.com
    │
    │  Merge to main (after testing on staging)
    ▼
main branch ─────────────► Manual approve → Deploy to algonex.com
```

**Step by step:**

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/add-new-course-api
   ```

2. **Develop and push:**
   ```bash
   git push origin feature/add-new-course-api
   ```

3. **Create a PR** to `staging` branch. Merge after review.

4. **Staging auto-deploys.** Test at `staging.algonex.com`.

5. **When ready for production,** merge `staging` into `main`.

6. **Approve the deploy** in GitHub Actions (Settings > Environments > production has required reviewers).

7. **Production updates** at `algonex.com`.

### Running Tests

```bash
# Backend tests (run before pushing)
cd algonex-backend && python3.11 -m pytest -v

# Frontend build check
cd algonex-frontend && npm run build

# Full Docker test suite
make test-docker
```

GitHub Actions runs these automatically on every push — if tests fail, deployment is blocked.

### Environment Variables

| File | Purpose | In Git? |
|------|---------|---------|
| `.env.example` | Template with all required variables | Yes |
| `.env` | Your local dev values | No (gitignored) |
| VPS `/opt/algonex/.env` | Production secrets | No |
| GitHub Secrets | CI/CD deploy keys | No (encrypted) |

**To set up locally:** `cp .env.example .env` and fill in values.

**Important production `.env` values:**
```bash
DJANGO_SECRET_KEY=<generate-a-random-key>
DJANGO_ALLOWED_HOSTS=algonex.com,www.algonex.com
DB_NAME=algonex_prod
DB_HOST=db
DB_PASSWORD=<strong-password>
DOMAIN=algonex.com
STAGING_DOMAIN=staging.algonex.com
SECURE_SSL_REDIRECT=false          # Caddy handles SSL, not Django
CORS_ALLOWED_ORIGINS=https://algonex.com
```

Generate a secret key:
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## First-Time VPS Setup

### Prerequisites

- A Hetzner account (sign up at hetzner.com)
- A domain name pointing to your VPS IP
- Your SSH public key
- A Backblaze B2 account (free, for backups)

### Step 1: Create the VPS

1. Go to Hetzner Cloud Console
2. Create a new server:
   - **Image:** Ubuntu 24.04
   - **Type:** CX22 (2 vCPU, 4GB RAM, 40GB SSD) — ~$5/month
   - **Location:** Choose closest to your users
   - **SSH key:** Add your public key
3. Note the IP address

### Step 2: Point Your Domain

At your domain registrar, set these DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `<vps-ip>` | 300 |
| A | www | `<vps-ip>` | 300 |
| A | staging | `<vps-ip>` | 300 |

**TTL of 300 seconds** (5 minutes) allows fast failover if you ever need to switch servers.

### Step 3: Harden the Server

SSH in as root and run the setup script:

```bash
ssh root@<vps-ip>
```

```bash
# Download and run the setup script
curl -sL https://raw.githubusercontent.com/<your-org>/<your-repo>/main/scripts/vps-setup.sh | bash -s -- 2222 deploy
```

This script:
- Creates a `deploy` user (no password login)
- Moves SSH to port 2222
- Disables root login and password auth
- Installs and configures firewall (ufw): only ports 80, 443, 2222
- Installs fail2ban (auto-blocks brute force)
- Enables automatic security updates
- Installs Docker + Docker Compose
- Installs rclone (for backups)
- Creates `/opt/algonex` and `/backups` directories

**After the script completes, log out and reconnect:**
```bash
ssh -p 2222 deploy@<vps-ip>
```

### Step 4: Configure Backups

```bash
rclone config
# Follow the prompts:
# Name: b2
# Storage type: b2
# Account ID: <from Backblaze B2 dashboard>
# Application Key: <from Backblaze B2 dashboard>
```

### Step 5: Configure GitHub Container Registry

```bash
# Create a GitHub Personal Access Token with `read:packages` scope
echo "<your-github-pat>" | docker login ghcr.io -u <your-github-username> --password-stdin
```

### Step 6: Deploy Files to VPS

From your local machine:

```bash
# Copy compose file and Caddyfile
scp -P 2222 docker-compose.prod.yml Caddyfile deploy@<vps-ip>:/opt/algonex/

# Copy scripts
scp -P 2222 scripts/*.sh deploy@<vps-ip>:/opt/algonex/scripts/

# Copy and configure .env
scp -P 2222 .env.example deploy@<vps-ip>:/opt/algonex/.env
ssh -p 2222 deploy@<vps-ip> "nano /opt/algonex/.env"  # Edit with production values
```

### Step 7: Start the Application

```bash
ssh -p 2222 deploy@<vps-ip>
cd /opt/algonex

# Pull images and start
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Run migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate --noinput

# Create admin user
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# (Optional) Seed sample data
docker compose -f docker-compose.prod.yml exec backend python manage.py seed_courses
```

### Step 8: Set Up Cron Jobs

```bash
ssh -p 2222 deploy@<vps-ip>

# Daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/algonex/scripts/backup.sh >> /var/log/algonex-backup.log 2>&1") | crontab -

# Health check every 30 minutes
(crontab -l 2>/dev/null; echo "*/30 * * * * /opt/algonex/scripts/health-check.sh >> /var/log/algonex-health.log 2>&1") | crontab -
```

### Step 9: Configure GitHub Actions Secrets

Go to your GitHub repo > Settings > Secrets and variables > Actions. Add:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | Your VPS IP address |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Contents of the deploy user's private SSH key |
| `VPS_SSH_PORT` | `2222` |

Then create environments:
1. Go to Settings > Environments
2. Create `staging` (no protection rules)
3. Create `production` with "Required reviewers" — add yourself

### Step 10: Set Up UptimeRobot

1. Sign up at [uptimerobot.com](https://uptimerobot.com) (free)
2. Add a monitor: `https://algonex.com` (HTTP, 5-min interval)
3. Add your email for alerts

**You're live!** Visit `https://algonex.com` to verify.

---

## Deploying Changes

### Automatic (Recommended)

Just push to the right branch:

```bash
# Deploy to staging (automatic)
git push origin staging

# Deploy to production (requires approval)
git push origin main
# Then go to GitHub Actions → click "Review deployments" → Approve
```

### Manual (Emergency)

SSH into the VPS and deploy directly:

```bash
ssh -p 2222 deploy@<vps-ip>
cd /opt/algonex

# Pull latest images
export IMAGE_TAG=latest
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Run migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate --noinput
```

### What the CI/CD Pipeline Does

```
┌──────────────────────────────────────────────────────────┐
│                    GitHub Actions                         │
│                                                          │
│  Job 1: TEST (runs on every push)                        │
│  ├── Install Python 3.11 + backend dependencies          │
│  ├── Run pytest (91 backend tests)                       │
│  ├── Install Node 20 + frontend dependencies             │
│  └── Run npm run build (catches build errors)            │
│                                                          │
│  Job 2: BUILD & PUSH (only if tests pass)                │
│  ├── Log into ghcr.io                                    │
│  ├── Build backend Docker image                          │
│  ├── Build frontend Docker image                         │
│  └── Push both to ghcr.io with git SHA tag               │
│                                                          │
│  Job 3a: DEPLOY STAGING (if push to staging)             │
│  └── SSH → pull → restart → migrate (automatic)          │
│                                                          │
│  Job 3b: DEPLOY PRODUCTION (if push to main)             │
│  ├── Wait for manual approval                            │
│  └── SSH → pull → restart → migrate                      │
└──────────────────────────────────────────────────────────┘
```

---

## Backups & Recovery

### What Gets Backed Up

| Data | Schedule | Retention | Where |
|------|----------|-----------|-------|
| PostgreSQL (all data) | Daily 2 AM | 7 daily + 4 weekly | VPS `/backups/` + Backblaze B2 |
| Media uploads | Daily 2 AM | 7 daily | VPS `/backups/` + Backblaze B2 |

### Backup Verification

The backup script automatically checks:
- Backup file exists
- File size > 0 bytes
- File size is at least 50% of yesterday's backup (catches silent corruption)
- Sends email alert if any check fails

### Check Backup Status

```bash
ssh -p 2222 deploy@<vps-ip>

# View recent backup logs
tail -30 /var/log/algonex-backup.log

# List local backups
ls -lh /backups/

# List remote backups (Backblaze B2)
rclone ls b2:algonex-backups
```

### Restore Database from Backup

```bash
ssh -p 2222 deploy@<vps-ip>
cd /opt/algonex

# Option A: Restore from local backup
gunzip -c /backups/db-2026-04-05.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres

# Option B: Restore from Backblaze B2
rclone copy b2:algonex-backups/db-2026-04-05.sql.gz /backups/
gunzip -c /backups/db-2026-04-05.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres
```

### Full Disaster Recovery (New VPS)

If your VPS dies completely:

1. Create a new Hetzner CX22
2. Run `scripts/vps-setup.sh`
3. Copy deployment files and `.env` to `/opt/algonex`
4. `docker login ghcr.io`
5. `docker compose -f docker-compose.prod.yml pull && up -d`
6. Restore database from Backblaze B2 backup
7. Update DNS A record to new IP

**Estimated time:** 30-60 minutes (DNS propagation is the bottleneck).

---

## Monitoring

### Health Checks (Automatic)

A cron script runs every 30 minutes and checks:
- Disk usage (alerts if > 85%)
- Memory usage (alerts if > 90%)
- All Docker containers running (backend, caddy, db)
- API responding (HTTP 200 on /api/v1/)
- Backup file exists for today

### UptimeRobot (External)

Pings your site every 5 minutes from external servers. Emails you if it's down. Free.

### Manual Checks

```bash
ssh -p 2222 deploy@<vps-ip>
cd /opt/algonex

# View running containers
docker compose -f docker-compose.prod.yml ps

# View logs (all containers)
docker compose -f docker-compose.prod.yml logs -f --tail 50

# View backend logs only
docker compose -f docker-compose.prod.yml logs -f backend --tail 50

# Check disk usage
df -h

# Check memory
free -h

# View health check history
tail -30 /var/log/algonex-health.log
```

---

## Rollback

### Quick Rollback (Bad Code, No DB Migration)

```bash
ssh -p 2222 deploy@<vps-ip>
cd /opt/algonex

# Find previous working image tag (git SHA)
# Check GitHub Actions history or:
docker images | grep ghcr.io

# Roll back to previous version
export IMAGE_TAG=<previous-git-sha>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Full Rollback (Including DB Migration)

If a bad migration was applied:

```bash
# 1. Roll back images (same as above)
export IMAGE_TAG=<previous-git-sha>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# 2. Restore database from pre-deploy backup
gunzip -c /backups/db-<date-before-deploy>.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db psql -U postgres
```

---

## Troubleshooting

### Site is Down

```bash
# Check if containers are running
docker compose -f docker-compose.prod.yml ps

# Restart everything
docker compose -f docker-compose.prod.yml restart

# Check Caddy logs (SSL/routing issues)
docker compose -f docker-compose.prod.yml logs caddy --tail 30

# Check backend logs (Django errors)
docker compose -f docker-compose.prod.yml logs backend --tail 30
```

### SSL Certificate Not Working

Caddy handles this automatically. If it's not working:
```bash
# Check Caddy logs
docker compose -f docker-compose.prod.yml logs caddy

# Common cause: DNS not pointing to VPS yet
# Verify: dig algonex.com → should show your VPS IP
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.prod.yml ps db

# Check DB_HOST in .env (should be "db", not "localhost")
grep DB_HOST /opt/algonex/.env

# Try connecting directly
docker compose -f docker-compose.prod.yml exec db psql -U postgres -d algonex_prod
```

### Disk Full

```bash
# Check what's using space
du -sh /var/lib/docker/*
du -sh /backups/*

# Clean old Docker resources
docker system prune -f

# Check log sizes
du -sh /var/log/*
```

### GitHub Actions Deploy Fails

1. Check the workflow run in GitHub Actions UI for error messages
2. Common issues:
   - **SSH connection refused:** Check VPS_SSH_PORT secret matches your SSH port
   - **Permission denied:** Check VPS_SSH_KEY secret is the private key (not public)
   - **Docker pull fails:** Check `docker login ghcr.io` still works on VPS

---

## Cost Breakdown

| Component | Monthly | Notes |
|-----------|---------|-------|
| Hetzner CX22 VPS | ~$5 | 2 vCPU, 4GB RAM, 40GB SSD |
| Domain (.com) | ~$1 | $12/year |
| SSL certificates | $0 | Let's Encrypt via Caddy |
| Backups (Backblaze B2) | $0 | 10GB free tier |
| CI/CD (GitHub Actions) | $0 | 2,000 min/month free for private repos |
| Container registry (ghcr.io) | $0 | 500MB free, auto-pruned |
| Uptime monitoring | $0 | UptimeRobot free tier |
| **Total** | **~$6/month** | |

### Scaling When You Need More

| When | Do This | New Cost |
|------|---------|----------|
| Need more RAM/CPU | Upgrade to CX32 (4 vCPU, 8GB) | ~$9/month |
| Need managed DB backups | Move PostgreSQL to managed service | +$7/month |
| Need global CDN | Add Cloudflare free tier | $0 |
| Outgrow single VPS | Migrate to Railway or AWS ECS | ~$20+/month |

Your Docker images are portable — they run anywhere without changes.
