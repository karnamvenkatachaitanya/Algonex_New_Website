# Algonex VPS Deployment Design

## Overview

Deploy the Algonex platform (Django REST API + React SPA) to a single Hetzner VPS using Docker Compose, with GitHub Actions CI/CD, automated backups, and server hardening. Target: production-ready for <1000 users at ~$6/month.

## Constraints

- **Budget:** ~$6/month total (compute + domain + backups)
- **Traffic:** <1000 users, infrequent deployments
- **Team:** Small team, minimal ops overhead desired
- **Growth path:** Design so migration to managed containers (Railway/ECS) is possible without rewrite

## Architecture

```
Internet
   │
   ▼ (HTTPS :443)
┌─────────────────────────────────────────────────┐
│           Hetzner CX22 VPS (~$5/month)          │
│            2 vCPU · 4GB RAM · 40GB SSD          │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Caddy (reverse proxy + auto-SSL)         │  │
│  │                                           │  │
│  │  /api/* /admin/*  →  Django (Gunicorn)    │  │
│  │  /*               →  React static files   │  │
│  │  staging.*        →  Staging environment   │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────┐  ┌──────────────────────┐    │
│  │ PostgreSQL 16 │  │ Docker Compose       │    │
│  │ :5432         │  │ (orchestrates all)   │    │
│  └──────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| VPS provider | Hetzner CX22 | Best price/performance (~$5/month for 2 vCPU, 4GB RAM) |
| Reverse proxy | Caddy (replaces nginx) | Auto SSL via Let's Encrypt, zero-maintenance cert renewal |
| Container orchestration | Docker Compose | Already exists in the project, minimal changes needed |
| Database | PostgreSQL 16 in Docker | Named volume for persistence, matches existing setup |
| Staging | Same VPS, separate Caddy subdomain | Zero extra cost, real test environment |

### Why Caddy Over Existing Nginx

The project has an nginx config, but Caddy provides:
- Automatic HTTPS with Let's Encrypt (no certbot, no cron jobs)
- Simpler config syntax (10 lines vs 40+)
- Auto HTTP→HTTPS redirect
- No certificate expiry risk

The existing nginx config in `nginx/nginx.conf` will be preserved but replaced by a `Caddyfile` for production deployment.

### Frontend Serving Strategy

The frontend container becomes a **build-only artifact** in production. The multi-stage `algonex-frontend/Dockerfile` builds the React app, and the final `dist/` output is copied to a shared Docker volume (`frontend_build`). Caddy serves these static files directly — no frontend runtime container needed.

```
# In docker-compose.prod.yml:
frontend-build:
  build: ./algonex-frontend
  volumes:
    - frontend_build:/app/dist   # Build output shared with Caddy
  # No CMD — exits after build

caddy:
  volumes:
    - frontend_build:/srv/frontend  # Caddy serves static files from here
```

### Staging vs Production Database Isolation

Both environments share a single PostgreSQL container but use **separate databases**:
- Production: `algonex_prod`
- Staging: `algonex_staging`

Each environment's `.env` file sets its own `DB_NAME`. This avoids the RAM overhead of running two PostgreSQL instances on a 4GB VPS while keeping data completely isolated.

### SSL and Django's SECURE_SSL_REDIRECT

Since Caddy terminates SSL and proxies to Django over HTTP, `SECURE_SSL_REDIRECT` must be `False` in the `.env` file to avoid redirect loops. Instead, configure Caddy to pass the `X-Forwarded-Proto: https` header, and set `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")` in Django production settings so Django knows the original request was HTTPS.

## CI/CD Pipeline

### Flow

```
Push to staging branch → GitHub Actions:
  1. Run pytest (backend tests)
  2. Run npm run build (frontend)
  3. Build Docker images
  4. Push to ghcr.io
  5. SSH into VPS → docker compose pull → up -d (auto)

Push to main branch → GitHub Actions:
  1. Run pytest (backend tests)
  2. Run npm run build (frontend)
  3. Build Docker images
  4. Push to ghcr.io
  5. Wait for manual approval (GitHub environment protection)
  6. SSH into VPS → docker compose pull → up -d
```

### GitHub Actions Details

- **Registry:** GitHub Container Registry (ghcr.io) — free 500MB for private repos
- **Image pruning:** Auto-delete images older than 2 versions to stay within 500MB free tier
- **Deploy mechanism:** SSH into VPS, run `docker compose pull && docker compose up -d --remove-orphans && docker compose exec backend python manage.py migrate --noinput`
- **Authentication:** GitHub Personal Access Token stored on VPS for `docker login ghcr.io`
- **Minutes budget:** ~2,000 free min/month for private repos; typical run ~5-8 min; infrequent deploys use <50 min/month

### Environments

| Environment | Trigger | Domain | Approval |
|-------------|---------|--------|----------|
| Staging | Push to `staging` | `staging.algonex.com` | Auto |
| Production | Push to `main` | `algonex.com` | Manual (GitHub UI) |

## Backups

| What | Method | Schedule | Retention | Storage |
|------|--------|----------|-----------|---------|
| PostgreSQL | `pg_dump` → gzip | Daily 2 AM (cron) | 7 daily + 4 weekly | VPS `/backups/` + Backblaze B2 |
| Media uploads | `tar` of Docker media volume | Daily 3 AM (cron) | 7 daily | VPS `/backups/` + Backblaze B2 |
| Off-site sync | `rclone sync` to Backblaze B2 | After each backup | Same as above | Backblaze B2 (10GB free) |
| VPS snapshot | Manual via Hetzner UI | Before risky changes only | 1-2 snapshots | Hetzner (~$0.01 each) |

### Backup Verification

A cron job runs after backups to verify:
- Today's backup file exists
- File size is >0 bytes
- File size is at least 50% of yesterday's backup (catches truncation/corruption)
- Email alert if any check fails

### Recovery Procedure

1. Provision new Hetzner CX22
2. Run `scripts/vps-setup.sh` (hardening + Docker install)
3. Pull latest images from ghcr.io
4. Restore PostgreSQL from latest Backblaze B2 backup
5. `docker compose up -d`
6. Update DNS to new VPS IP

Estimated recovery time: ~30-60 minutes (DNS propagation is the bottleneck — keep DNS TTL at 300 seconds to minimize this).

### Rollback Procedure

If a deployment introduces a bug:
1. Identify the previous working image tag from ghcr.io
2. Update `docker-compose.prod.yml` image tags to the previous version
3. `docker compose pull && docker compose up -d`
4. If a database migration was applied, restore from the latest pre-deploy backup

Since images are tagged by git SHA in ghcr.io, rollback is a matter of changing the tag and restarting.

## Security

### VPS Hardening

- SSH: key-only authentication, disable password login, non-default port
- Firewall (ufw): allow only ports 80, 443, and SSH port
- Fail2ban: auto-block brute force attempts on SSH
- Unattended upgrades: auto-install security patches (Ubuntu)
- Docker: non-root containers (backend Dockerfile needs `USER` directive added — see Files to Modify)

### Application Security (Already Implemented)

- `SECURE_SSL_REDIRECT=False` in `.env` (Caddy handles SSL termination; see SSL section above)
- HSTS headers enabled
- Secure cookies (SESSION_COOKIE_SECURE, CSRF_COOKIE_SECURE)
- JWT auth with rotating refresh tokens
- Rate limiting: 30/min anonymous, 120/min authenticated
- CORS restricted to production domain

### Secrets Management

- `.env` file on VPS (not in git, already in `.gitignore`)
- GitHub Actions secrets for: SSH deploy key, ghcr.io token
- No hardcoded credentials in codebase

## Monitoring

| What | Tool | Cost |
|------|------|------|
| Uptime | UptimeRobot free tier (5-min ping interval, email alerts) | $0 |
| Server health | Cron script: disk usage, memory, container status → email alert | $0 |
| Application logs | `docker compose logs` with log rotation (`json-file`, max 10MB, 3 files) | $0 |
| Backup health | Cron verification script (see Backups section) | $0 |

### Not Included (Overkill at This Scale)

- Grafana/Prometheus — unnecessary for <1000 users
- Sentry — Django's built-in error emails suffice initially
- Log aggregation — `docker compose logs -f` via SSH is adequate

## Files to Create or Modify

| File | Action | Purpose |
|------|--------|---------|
| `Caddyfile` | Create | Reverse proxy config with auto-SSL |
| `docker-compose.prod.yml` | Create | Production compose with Caddy, optimized settings |
| `.github/workflows/deploy.yml` | Create | CI/CD pipeline (test → build → push → deploy) |
| `.github/workflows/prune-images.yml` | Create | Scheduled cleanup of old ghcr.io images |
| `scripts/backup.sh` | Create | PostgreSQL + media backup with rclone sync |
| `scripts/health-check.sh` | Create | Server health monitoring cron script |
| `scripts/vps-setup.sh` | Create | Initial VPS hardening (SSH, ufw, fail2ban, Docker) |
| `docs/deployment-guide.md` | Create | Runbook for setup, deploy, backup, and recovery |
| `algonex-backend/Dockerfile` | Modify | Add non-root user (`adduser appuser` + `USER appuser`) before CMD |
| `algonex-frontend/Dockerfile` | Modify | Build-only: multi-stage build outputs `dist/` to shared volume, no runtime container |

## Cost Summary

| Component | Monthly Cost |
|-----------|-------------|
| Hetzner CX22 VPS | ~$5 |
| Domain (.com) | ~$1 ($12/year) |
| SSL (Caddy + Let's Encrypt) | $0 |
| Backups (Backblaze B2 free tier) | $0 |
| GitHub Actions (private repo, infrequent) | $0 |
| ghcr.io (with image pruning) | $0 |
| UptimeRobot (free tier) | $0 |
| **Total** | **~$6/month** |

## Scaling Path

When the project outgrows a single VPS:
1. **Vertical:** Upgrade to CX32 (4 vCPU, 8GB RAM, ~$9/month) — no config changes
2. **Managed DB:** Move PostgreSQL to a managed service (Hetzner Cloud SQL or external) — change `DB_HOST` env var
3. **Container platform:** Move Docker images to Railway, AWS ECS, or DigitalOcean App Platform — images are portable, no rebuild needed
4. **CDN:** Add Cloudflare free tier in front of Caddy for static asset caching and DDoS protection
