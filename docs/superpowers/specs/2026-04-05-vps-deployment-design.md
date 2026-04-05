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
- **Image pruning:** Auto-delete images older than 3 versions to stay within free tier
- **Deploy mechanism:** SSH into VPS, run `docker compose pull && docker compose up -d --remove-orphans`
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
- Email alert if either check fails

### Recovery Procedure

1. Provision new Hetzner CX22
2. Run `scripts/vps-setup.sh` (hardening + Docker install)
3. Pull latest images from ghcr.io
4. Restore PostgreSQL from latest Backblaze B2 backup
5. `docker compose up -d`
6. Update DNS to new VPS IP

Estimated recovery time: ~15 minutes.

## Security

### VPS Hardening

- SSH: key-only authentication, disable password login, non-default port
- Firewall (ufw): allow only ports 80, 443, and SSH port
- Fail2ban: auto-block brute force attempts on SSH
- Unattended upgrades: auto-install security patches (Ubuntu)
- Docker: non-root containers (existing Dockerfiles already comply)

### Application Security (Already Implemented)

- `SECURE_SSL_REDIRECT=True` in production settings
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
| Application logs | `docker compose logs` with Docker log rotation | $0 |
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
| `algonex-backend/Dockerfile` | Modify | Ensure non-root user, multi-stage if not already |
| `algonex-frontend/Dockerfile` | Modify | Swap nginx stage for simple static file output |

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
