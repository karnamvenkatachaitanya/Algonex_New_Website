# VPS Deployment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy Algonex (Django + React) to a Hetzner VPS with Docker Compose, Caddy, GitHub Actions CI/CD, automated backups, and server hardening — all for ~$6/month.

**Architecture:** Single Hetzner CX22 VPS running Docker Compose with Caddy (auto-SSL reverse proxy), Django/Gunicorn backend, PostgreSQL 16, and React static files served by Caddy from a shared volume. GitHub Actions builds images, pushes to ghcr.io, and deploys via SSH. Staging and production share the VPS with separate databases and Caddy subdomains.

**Tech Stack:** Docker Compose, Caddy 2, GitHub Actions, ghcr.io, Backblaze B2, rclone, fail2ban, ufw

**Spec:** `docs/superpowers/specs/2026-04-05-vps-deployment-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `Caddyfile` | Create | Reverse proxy: routes /api and /admin to Django, everything else to React static files; auto-SSL; staging subdomain |
| `docker-compose.prod.yml` | Create | Production orchestration: Caddy, backend, db, frontend-build; log rotation; named volumes |
| `.github/workflows/deploy.yml` | Create | CI/CD: test → build → push to ghcr.io → deploy via SSH (auto for staging, manual approval for prod) |
| `.github/workflows/prune-images.yml` | Create | Weekly scheduled cleanup of old ghcr.io images (keep last 2) |
| `scripts/backup.sh` | Create | Daily pg_dump + media tar + rclone sync to Backblaze B2 with retention and verification. *Deviation from spec:* DB and media backups combined into one script at 2 AM instead of separate cron jobs at 2 AM / 3 AM — simpler and acceptable at current scale. |
| `scripts/health-check.sh` | Create | Cron health monitor: disk, memory, containers, backup status → email alert |
| `scripts/vps-setup.sh` | Create | One-time VPS hardening: SSH lockdown, ufw, fail2ban, unattended-upgrades, Docker install |
| `docs/deployment-guide.md` | Create | Runbook: initial setup, deploy, backup/restore, rollback, monitoring |
| `algonex-backend/Dockerfile` | Modify | Add non-root user before CMD |
| `algonex-backend/config/settings/production.py` | Modify | Add `SECURE_PROXY_SSL_HEADER` for Caddy SSL termination |
| `.env.example` | Modify | Add `SECURE_SSL_REDIRECT=false` and production domain vars |

---

## Chunk 1: Docker & Caddy Infrastructure

### Task 1: Harden Backend Dockerfile with Non-Root User

**Files:**
- Modify: `algonex-backend/Dockerfile:17-27`

- [ ] **Step 1: Add non-root user to backend Dockerfile**

After the `COPY . .` and `collectstatic` lines, before `EXPOSE`, add:

```dockerfile
# Run as non-root user
RUN adduser --disabled-password --no-create-home appuser && \
    chown -R appuser:appuser /app
USER appuser
```

The full Dockerfile becomes:

```dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy project
COPY . .

# Collect static files
RUN DJANGO_SETTINGS_MODULE=config.settings.production \
    DJANGO_SECRET_KEY=build-time-secret \
    python manage.py collectstatic --noinput 2>/dev/null || true

# Run as non-root user
RUN adduser --disabled-password --no-create-home appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "1", "--timeout", "120"]
```

- [ ] **Step 2: Verify backend image builds**

Run: `docker build -t algonex-backend-test ./algonex-backend`
Expected: Builds successfully, no errors.

- [ ] **Step 3: Commit**

```bash
git add algonex-backend/Dockerfile
git commit -m "security: add non-root user to backend Dockerfile"
```

---

### Task 2: Update Frontend Dockerfile for Build-Only Output

**Files:**
- Modify: `algonex-frontend/Dockerfile`

- [ ] **Step 1: Rewrite frontend Dockerfile with multi-target**

Use a multi-target Dockerfile: the default target keeps nginx (for existing dev docker-compose), and a `prod` target is build-only for Caddy serving. Replace the entire Dockerfile:

```dockerfile
# Stage 1: Build the React app
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2 (default): Serve with nginx — used by docker-compose.yml (dev)
FROM nginx:alpine AS dev

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Production build-only — used by docker-compose.prod.yml
FROM alpine:3.19 AS prod

COPY --from=build /app/dist /app/dist

# This container exits after start — its only job is to populate the volume
CMD ["echo", "Frontend build complete"]
```

Note: `docker-compose.prod.yml` targets the `prod` stage via `target: prod` in its build config.

- [ ] **Step 2: Verify frontend image builds**

Run: `docker build -t algonex-frontend-test ./algonex-frontend`
Expected: Builds successfully, `dist/` directory contains `index.html` and `assets/`.

- [ ] **Step 3: Commit**

```bash
git add algonex-frontend/Dockerfile
git commit -m "refactor: make frontend Dockerfile build-only for Caddy serving"
```

---

### Task 3: Create Caddyfile

**Files:**
- Create: `Caddyfile`

- [ ] **Step 1: Create the Caddyfile**

```caddyfile
# Production: algonex.com
{$DOMAIN:localhost} {
    # API and admin routes → Django backend
    handle /api/* {
        reverse_proxy backend:8000 {
            header_up X-Forwarded-Proto {scheme}
        }
    }

    handle /admin/* {
        reverse_proxy backend:8000 {
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Django static files (admin CSS/JS) — served directly by Caddy
    handle /static/* {
        root * /srv
        file_server
    }

    # Media files (uploads) — served directly by Caddy
    handle /media/* {
        root * /srv
        file_server
    }

    # React SPA — serve static files, fallback to index.html
    handle {
        root * /srv/frontend
        try_files {path} /index.html
        file_server
    }
}

# Staging: staging.algonex.com (optional, enabled via env)
{$STAGING_DOMAIN:} {
    handle /api/* {
        reverse_proxy staging-backend:8000 {
            header_up X-Forwarded-Proto {scheme}
        }
    }

    handle /admin/* {
        reverse_proxy staging-backend:8000 {
            header_up X-Forwarded-Proto {scheme}
        }
    }

    handle /static/* {
        root * /srv
        file_server
    }

    handle /media/* {
        root * /srv
        file_server
    }

    handle {
        root * /srv/staging-frontend
        try_files {path} /index.html
        file_server
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add Caddyfile
git commit -m "feat: add Caddyfile for production reverse proxy with auto-SSL"
```

---

### Task 4: Create Production Docker Compose

**Files:**
- Create: `docker-compose.prod.yml`

- [ ] **Step 1: Create docker-compose.prod.yml**

```yaml
services:
  backend:
    image: ghcr.io/${GITHUB_REPO:-algonex}/backend:${IMAGE_TAG:-latest}
    build: ./algonex-backend
    env_file: .env
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.production
    volumes:
      - media_data:/app/media
      - static_data:/app/staticfiles
    expose:
      - "8000"
    depends_on:
      - db
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  frontend-build:
    image: ghcr.io/${GITHUB_REPO:-algonex}/frontend:${IMAGE_TAG:-latest}
    build:
      context: ./algonex-frontend
      target: prod
      args:
        VITE_API_URL: /api/v1
    volumes:
      - frontend_build:/app/dist
    restart: "no"

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - frontend_build:/srv/frontend:ro
      - static_data:/srv/static:ro
      - media_data:/srv/media:ro
      - caddy_data:/data
      - caddy_config:/config
    environment:
      - DOMAIN=${DOMAIN:-localhost}
      - STAGING_DOMAIN=${STAGING_DOMAIN:-}
    depends_on:
      - backend
      - frontend-build
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-algonex}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    expose:
      - "5432"
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
  media_data:
  static_data:
  frontend_build:
  caddy_data:
  caddy_config:
```

- [ ] **Step 2: Test compose config is valid**

Run: `docker compose -f docker-compose.prod.yml config --quiet`
Expected: No errors (exits 0).

- [ ] **Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add production Docker Compose with Caddy and log rotation"
```

---

### Task 5: Update Django Production Settings for Caddy SSL

**Files:**
- Modify: `algonex-backend/config/settings/production.py:36`
- Modify: `.env.example`

- [ ] **Step 1: Add SECURE_PROXY_SSL_HEADER to production settings**

In `algonex-backend/config/settings/production.py`, after line 36 (`SECURE_SSL_REDIRECT = ...`), add:

```python
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
```

- [ ] **Step 2: Update .env.example with production deployment vars**

Append to `.env.example`:

```bash
# Deployment (production)
# SECURE_SSL_REDIRECT=false
# DOMAIN=algonex.com
# STAGING_DOMAIN=staging.algonex.com
# GITHUB_REPO=your-org/algonex
# IMAGE_TAG=latest
```

- [ ] **Step 3: Run backend tests to verify settings don't break anything**

Run: `cd algonex-backend && python3.11 -m pytest -v`
Expected: All 91 tests pass.

- [ ] **Step 4: Commit**

```bash
git add algonex-backend/config/settings/production.py .env.example
git commit -m "feat: add SECURE_PROXY_SSL_HEADER for Caddy SSL termination"
```

---

## Chunk 2: CI/CD Pipeline

### Task 6: Create GitHub Actions Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the deploy workflow**

```yaml
name: Build & Deploy

on:
  push:
    branches: [main, staging]

env:
  REGISTRY: ghcr.io
  BACKEND_IMAGE: ghcr.io/${{ github.repository }}/backend
  FRONTEND_IMAGE: ghcr.io/${{ github.repository }}/frontend

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install backend dependencies
        run: |
          cd algonex-backend
          pip install -r requirements.txt
          pip install pytest pytest-django pytest-cov factory-boy

      - name: Run backend tests
        env:
          DJANGO_SETTINGS_MODULE: config.settings.testing
        run: |
          cd algonex-backend
          python -m pytest -v

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: algonex-frontend/package-lock.json

      - name: Build frontend
        run: |
          cd algonex-frontend
          npm ci
          npm run build

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push backend image
        uses: docker/build-push-action@v5
        with:
          context: ./algonex-backend
          push: true
          tags: |
            ${{ env.BACKEND_IMAGE }}:${{ github.sha }}
            ${{ env.BACKEND_IMAGE }}:latest

      - name: Build and push frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./algonex-frontend
          push: true
          tags: |
            ${{ env.FRONTEND_IMAGE }}:${{ github.sha }}
            ${{ env.FRONTEND_IMAGE }}:latest
          build-args: |
            VITE_API_URL=/api/v1

  deploy-staging:
    if: github.ref == 'refs/heads/staging'
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - name: Deploy to staging
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_SSH_PORT }}
          script: |
            cd /opt/algonex
            export IMAGE_TAG=${{ github.sha }}
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_SSH_PORT }}
          script: |
            cd /opt/algonex
            export IMAGE_TAG=${{ github.sha }}
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions CI/CD deploy workflow"
```

---

### Task 7: Create Image Pruning Workflow

**Files:**
- Create: `.github/workflows/prune-images.yml`

- [ ] **Step 1: Create the prune workflow**

```yaml
name: Prune Old Container Images

on:
  schedule:
    - cron: "0 3 * * 0"  # Weekly on Sunday at 3 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  prune:
    runs-on: ubuntu-latest
    permissions:
      packages: write

    steps:
      - name: Prune backend images (keep last 2)
        uses: actions/delete-package-versions@v5
        with:
          package-name: "algonex/backend"
          package-type: container
          min-versions-to-keep: 2
          delete-only-untagged-versions: false

      - name: Prune frontend images (keep last 2)
        uses: actions/delete-package-versions@v5
        with:
          package-name: "algonex/frontend"
          package-type: container
          min-versions-to-keep: 2
          delete-only-untagged-versions: false
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/prune-images.yml
git commit -m "feat: add weekly ghcr.io image pruning workflow"
```

---

## Chunk 3: Server Scripts

### Task 8: Create VPS Setup Script

**Files:**
- Create: `scripts/vps-setup.sh`

- [ ] **Step 1: Create the VPS hardening script**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Algonex VPS Setup Script
# Run as root on a fresh Ubuntu 22.04/24.04 Hetzner CX22
# Usage: curl -sL <raw-github-url> | bash -s -- <ssh-port> <username>

SSH_PORT="${1:-2222}"
DEPLOY_USER="${2:-deploy}"

echo "=== Algonex VPS Setup ==="
echo "SSH Port: $SSH_PORT"
echo "Deploy User: $DEPLOY_USER"

# --- System Updates ---
apt-get update && apt-get upgrade -y

# --- Create deploy user ---
if ! id "$DEPLOY_USER" &>/dev/null; then
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
    # Copy root's authorized_keys to deploy user
    mkdir -p "/home/$DEPLOY_USER/.ssh"
    cp /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
    chmod 700 "/home/$DEPLOY_USER/.ssh"
    chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
    # Allow sudo without password for deploy user
    echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/$DEPLOY_USER"
fi

# --- SSH Hardening ---
sed -i "s/#Port 22/Port $SSH_PORT/" /etc/ssh/sshd_config
sed -i "s/Port 22/Port $SSH_PORT/" /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# --- Firewall (ufw) ---
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow "$SSH_PORT/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# --- Fail2ban ---
apt-get install -y fail2ban
cat > /etc/fail2ban/jail.local <<JAIL
[sshd]
enabled = true
port = $SSH_PORT
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
JAIL
systemctl enable fail2ban
systemctl restart fail2ban

# --- Unattended Upgrades ---
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# --- Docker ---
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker "$DEPLOY_USER"

# --- Project Directory ---
mkdir -p /opt/algonex
chown "$DEPLOY_USER:$DEPLOY_USER" /opt/algonex

# --- Backup Directory ---
mkdir -p /backups
chown "$DEPLOY_USER:$DEPLOY_USER" /backups

# --- Install rclone (for Backblaze B2 backups) ---
curl https://rclone.org/install.sh | bash

echo ""
echo "=== Setup Complete ==="
echo "SSH port: $SSH_PORT"
echo "Deploy user: $DEPLOY_USER"
echo "Project dir: /opt/algonex"
echo "Backups dir: /backups"
echo ""
echo "Next steps:"
echo "1. Log out and reconnect as: ssh -p $SSH_PORT $DEPLOY_USER@<vps-ip>"
echo "2. Configure rclone for Backblaze B2: rclone config"
echo "3. Copy .env and docker-compose.prod.yml to /opt/algonex"
echo "4. Run: docker login ghcr.io"
echo "5. Run: docker compose -f docker-compose.prod.yml up -d"
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x scripts/vps-setup.sh`

- [ ] **Step 3: Commit**

```bash
git add scripts/vps-setup.sh
git commit -m "feat: add VPS setup script with SSH hardening, ufw, fail2ban, Docker"
```

---

### Task 9: Create Backup Script

**Files:**
- Create: `scripts/backup.sh`

- [ ] **Step 1: Create the backup script**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Algonex Backup Script (runs both DB + media sequentially for simplicity)
# Cron: 0 2 * * * /opt/algonex/scripts/backup.sh >> /var/log/algonex-backup.log 2>&1

BACKUP_DIR="/backups"
DATE=$(date +%Y-%m-%d)
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
COMPOSE_FILE="/opt/algonex/docker-compose.prod.yml"
RCLONE_REMOTE="b2:algonex-backups"
ALERT_EMAIL="${ALERT_EMAIL:-}"

# --- PostgreSQL Backup ---
echo "[$(date)] Starting PostgreSQL backup..."
docker compose -f "$COMPOSE_FILE" exec -T db pg_dumpall -U postgres | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"
echo "[$(date)] PostgreSQL backup complete: db-$DATE.sql.gz ($(du -h "$BACKUP_DIR/db-$DATE.sql.gz" | cut -f1))"

# --- Media Backup ---
echo "[$(date)] Starting media backup..."
docker run --rm -v algonex_media_data:/data -v "$BACKUP_DIR":/backup alpine \
    tar czf "/backup/media-$DATE.tar.gz" -C /data .
echo "[$(date)] Media backup complete: media-$DATE.tar.gz"

# --- Verification ---
echo "[$(date)] Verifying backups..."
VERIFY_FAILED=0

for FILE in "db-$DATE.sql.gz" "media-$DATE.tar.gz"; do
    FILEPATH="$BACKUP_DIR/$FILE"
    if [ ! -f "$FILEPATH" ]; then
        echo "[ERROR] Missing: $FILE"
        VERIFY_FAILED=1
        continue
    fi

    SIZE=$(stat -c%s "$FILEPATH" 2>/dev/null || stat -f%z "$FILEPATH")
    if [ "$SIZE" -eq 0 ]; then
        echo "[ERROR] Empty file: $FILE"
        VERIFY_FAILED=1
        continue
    fi

    # Compare with yesterday's backup (size sanity check)
    YESTERDAY=$(date -d "yesterday" +%Y-%m-%d 2>/dev/null || date -v-1d +%Y-%m-%d)
    YESTERDAY_FILE="$BACKUP_DIR/${FILE/$DATE/$YESTERDAY}"
    if [ -f "$YESTERDAY_FILE" ]; then
        YESTERDAY_SIZE=$(stat -c%s "$YESTERDAY_FILE" 2>/dev/null || stat -f%z "$YESTERDAY_FILE")
        THRESHOLD=$((YESTERDAY_SIZE / 2))
        if [ "$SIZE" -lt "$THRESHOLD" ]; then
            echo "[WARN] $FILE is less than 50% of yesterday's size ($SIZE vs $YESTERDAY_SIZE)"
            VERIFY_FAILED=1
        fi
    fi
done

# --- Retention: keep 7 daily ---
echo "[$(date)] Cleaning old daily backups..."
find "$BACKUP_DIR" -name "db-*.sql.gz" -mtime +7 -not -name "*-weekly*" -delete
find "$BACKUP_DIR" -name "media-*.tar.gz" -mtime +7 -not -name "*-weekly*" -delete

# --- Weekly backup (Sunday) ---
if [ "$DAY_OF_WEEK" -eq 7 ]; then
    echo "[$(date)] Creating weekly backup copies..."
    cp "$BACKUP_DIR/db-$DATE.sql.gz" "$BACKUP_DIR/db-$DATE-weekly.sql.gz"
    cp "$BACKUP_DIR/media-$DATE.tar.gz" "$BACKUP_DIR/media-$DATE-weekly.tar.gz"
    # Keep 4 weekly backups
    find "$BACKUP_DIR" -name "*-weekly*" -mtime +28 -delete
fi

# --- Off-site sync to Backblaze B2 ---
echo "[$(date)] Syncing to Backblaze B2..."
if command -v rclone &>/dev/null; then
    rclone sync "$BACKUP_DIR" "$RCLONE_REMOTE" --transfers 2 --log-level INFO
    echo "[$(date)] B2 sync complete."
else
    echo "[WARN] rclone not installed, skipping off-site sync."
    VERIFY_FAILED=1
fi

# --- Alert on failure ---
if [ "$VERIFY_FAILED" -ne 0 ] && [ -n "$ALERT_EMAIL" ]; then
    echo "Algonex backup verification failed on $DATE. Check /var/log/algonex-backup.log" | \
        mail -s "[ALERT] Algonex Backup Issue - $DATE" "$ALERT_EMAIL"
fi

echo "[$(date)] Backup process complete."
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x scripts/backup.sh`

- [ ] **Step 3: Commit**

```bash
git add scripts/backup.sh
git commit -m "feat: add automated backup script with verification and B2 sync"
```

---

### Task 10: Create Health Check Script

**Files:**
- Create: `scripts/health-check.sh`

- [ ] **Step 1: Create the health check script**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Algonex Health Check Script
# Cron: */30 * * * * /opt/algonex/scripts/health-check.sh >> /var/log/algonex-health.log 2>&1

COMPOSE_FILE="/opt/algonex/docker-compose.prod.yml"
ALERT_EMAIL="${ALERT_EMAIL:-}"
ISSUES=()

echo "[$(date)] Running health check..."

# --- Disk Usage ---
DISK_USAGE=$(df / --output=pcent | tail -1 | tr -d ' %')
if [ "$DISK_USAGE" -gt 85 ]; then
    ISSUES+=("Disk usage at ${DISK_USAGE}%")
fi

# --- Memory Usage ---
MEM_AVAILABLE=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
MEM_TOTAL=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
MEM_USED_PCT=$(( (MEM_TOTAL - MEM_AVAILABLE) * 100 / MEM_TOTAL ))
if [ "$MEM_USED_PCT" -gt 90 ]; then
    ISSUES+=("Memory usage at ${MEM_USED_PCT}%")
fi

# --- Container Status ---
CONTAINERS=("backend" "caddy" "db")
for CONTAINER in "${CONTAINERS[@]}"; do
    STATUS=$(docker compose -f "$COMPOSE_FILE" ps --format json "$CONTAINER" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('State','unknown'))" 2>/dev/null || echo "not found")
    if [ "$STATUS" != "running" ]; then
        ISSUES+=("Container '$CONTAINER' is $STATUS")
    fi
done

# --- API Health ---
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/v1/ --max-time 10 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "000" ]; then
    ISSUES+=("API not responding")
elif [ "$HTTP_CODE" -ge 500 ]; then
    ISSUES+=("API returning HTTP $HTTP_CODE")
fi

# --- Report ---
if [ ${#ISSUES[@]} -gt 0 ]; then
    echo "[ALERT] Issues found:"
    for ISSUE in "${ISSUES[@]}"; do
        echo "  - $ISSUE"
    done
    if [ -n "$ALERT_EMAIL" ]; then
        printf '%s\n' "${ISSUES[@]}" | mail -s "[ALERT] Algonex Health Check - $(date +%Y-%m-%d)" "$ALERT_EMAIL"
    fi
else
    echo "[OK] All checks passed."
fi
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x scripts/health-check.sh`

- [ ] **Step 3: Commit**

```bash
git add scripts/health-check.sh
git commit -m "feat: add server health check script for cron monitoring"
```

---

## Chunk 4: Documentation

### Task 11: Create Deployment Guide

**Files:**
- Create: `docs/deployment-guide.md`

- [ ] **Step 1: Create the deployment runbook**

```markdown
# Algonex Deployment Guide

## Prerequisites

- Hetzner CX22 VPS (Ubuntu 22.04/24.04)
- Domain with DNS pointing to VPS IP
- GitHub repo with Actions secrets configured
- Backblaze B2 account (free tier)

## Initial VPS Setup

1. SSH into the VPS as root:
   ```bash
   ssh root@<vps-ip>
   ```

2. Run the setup script:
   ```bash
   curl -sL https://raw.githubusercontent.com/<your-repo>/main/scripts/vps-setup.sh | bash -s -- 2222 deploy
   ```

3. Reconnect as deploy user:
   ```bash
   ssh -p 2222 deploy@<vps-ip>
   ```

4. Configure rclone for Backblaze B2:
   ```bash
   rclone config
   # Name: b2
   # Type: b2
   # Account: <your-key-id>
   # Key: <your-app-key>
   ```

5. Log into GitHub Container Registry:
   ```bash
   echo "<github-pat>" | docker login ghcr.io -u <github-username> --password-stdin
   ```

6. Copy deployment files to VPS:
   ```bash
   # From your local machine:
   scp -P 2222 docker-compose.prod.yml Caddyfile deploy@<vps-ip>:/opt/algonex/
   scp -P 2222 scripts/*.sh deploy@<vps-ip>:/opt/algonex/scripts/
   ```

7. Create the production .env file:
   ```bash
   ssh -p 2222 deploy@<vps-ip>
   cd /opt/algonex
   cp .env.example .env
   # Edit .env with production values:
   # DJANGO_SECRET_KEY=<generate with: python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
   # DJANGO_ALLOWED_HOSTS=algonex.com,www.algonex.com
   # DB_NAME=algonex_prod
   # DB_PASSWORD=<strong-password>
   # DOMAIN=algonex.com
   # SECURE_SSL_REDIRECT=false
   # CORS_ALLOWED_ORIGINS=https://algonex.com
   ```

8. Start the application:
   ```bash
   cd /opt/algonex
   docker compose -f docker-compose.prod.yml up -d
   docker compose -f docker-compose.prod.yml exec backend python manage.py migrate --noinput
   docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
   ```

## GitHub Actions Secrets

Configure these in GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | VPS IP address |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Contents of deploy user's private SSH key |
| `VPS_SSH_PORT` | `2222` (or your chosen port) |

Configure environment protection rules:
- Go to Settings → Environments → Create "production"
- Enable "Required reviewers" and add yourself

## Deploying

**Staging (automatic):**
```bash
git push origin staging
```

**Production (manual approval):**
```bash
git push origin main
# Go to GitHub Actions → approve the deployment
```

## Backup & Restore

**Setup cron jobs** (run once on VPS):
```bash
# Daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/algonex/scripts/backup.sh >> /var/log/algonex-backup.log 2>&1") | crontab -

# Health check every 30 minutes
(crontab -l 2>/dev/null; echo "*/30 * * * * /opt/algonex/scripts/health-check.sh >> /var/log/algonex-health.log 2>&1") | crontab -
```

**Restore from backup:**
```bash
# Download from B2
rclone copy b2:algonex-backups/db-2026-04-05.sql.gz /backups/

# Restore
gunzip -c /backups/db-2026-04-05.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres
```

## Rollback

```bash
# On the VPS:
cd /opt/algonex
export IMAGE_TAG=<previous-git-sha>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

If a migration needs reverting, restore the database from the pre-deploy backup.

## Monitoring

- **UptimeRobot:** Set up at https://uptimerobot.com — monitor `https://algonex.com`
- **Logs:** `docker compose -f docker-compose.prod.yml logs -f --tail 100`
- **Health:** `cat /var/log/algonex-health.log | tail -20`
- **Backups:** `cat /var/log/algonex-backup.log | tail -20`

## DNS Configuration

Set these DNS records (at your domain registrar):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `<vps-ip>` | 300 |
| A | www | `<vps-ip>` | 300 |
| A | staging | `<vps-ip>` | 300 |
```

- [ ] **Step 2: Commit**

```bash
git add docs/deployment-guide.md
git commit -m "docs: add deployment guide with setup, deploy, backup, and rollback"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Non-root backend Dockerfile | `algonex-backend/Dockerfile` |
| 2 | Build-only frontend Dockerfile | `algonex-frontend/Dockerfile` |
| 3 | Caddyfile | `Caddyfile` |
| 4 | Production Docker Compose | `docker-compose.prod.yml` |
| 5 | Django SSL proxy header | `production.py`, `.env.example` |
| 6 | CI/CD deploy workflow | `.github/workflows/deploy.yml` |
| 7 | Image pruning workflow | `.github/workflows/prune-images.yml` |
| 8 | VPS setup script | `scripts/vps-setup.sh` |
| 9 | Backup script | `scripts/backup.sh` |
| 10 | Health check script | `scripts/health-check.sh` |
| 11 | Deployment guide | `docs/deployment-guide.md` |

**Total: 11 tasks, ~11 commits, 11 files created/modified.**
