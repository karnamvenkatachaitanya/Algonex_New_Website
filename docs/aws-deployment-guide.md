# Algonex AWS Deployment Guide

This guide details how to host and deploy the Algonex platform on Amazon Web Services (AWS) using a production-ready, cost-effective containerized architecture.

---

## 1. Computational Power & AWS Service Selection

### Recommended Architecture: AWS EC2 with Docker Compose
For starting and running a standard, low-to-medium traffic platform like Algonex, the most cost-effective and straightforward setup is **AWS EC2 (Elastic Compute Cloud)** running your Docker Compose stack. 

*   **Why?** This matches your local production docker-compose configuration exactly. It allows **Caddy** to handle Let's Encrypt SSL generation automatically (which fails behind AWS Application Load Balancers without complex Certificate Manager setups) and keeps your monthly bill under $15-$25.

### Instance Sizing (Computational Requirements)

Based on the resource footprint of your services:
*   **Django + Gunicorn (Backend)**: ~150MB - 300MB RAM
*   **PostgreSQL (Database)**: ~200MB - 500MB RAM
*   **Caddy (Reverse Proxy/Frontend)**: ~50MB RAM

| AWS Instance Type | Specifications | Estimated Monthly Cost | Recommendation |
| :--- | :--- | :--- | :--- |
| **t3.micro** | 2 vCPUs, 1 GiB RAM | ~$8.00 | **Not Recommended**: PostgreSQL + Django compiling static assets will easily hit the 1GB RAM limit, causing out-of-memory (OOM) crashes. |
| **t3.small** | 2 vCPUs, 2 GiB RAM | ~$15.00 | **Recommended (Entry Level)**: Perfectly sized for staging, testing, and low-traffic launch. |
| **t3.medium** | 2 vCPUs, 4 GiB RAM | ~$30.00 | **Recommended (Production)**: Highly stable for production. Provides a comfortable memory overhead for database queries, backups, and file builds. |

**Operating System**: **Ubuntu 24.04 LTS (HVM)** (Standard 64-bit x86 architecture).

---

## 2. AWS Console Prerequisites

Before running any commands on the server, configure these resources in the AWS Management Console:

### Step 1: Launch the EC2 Instance
1. Open the EC2 Dashboard and click **Launch Instance**.
2. Select **Ubuntu Server 24.04 LTS** as the AMI.
3. Choose **t3.small** (or **t3.medium**).
4. Create or select a key pair (`.pem` file) for SSH access.
5. Set storage to **20 GB or 30 GB** General Purpose SSD (gp3).

### Step 2: Configure the Security Group (Firewall)
Under network settings, create a security group with the following inbound rules:

| Type | Port Range | Source | Description |
| :--- | :--- | :--- | :--- |
| **SSH** | `22` | `My IP` (or `0.0.0.0/0`) | Secure command line access |
| **HTTP** | `80` | `0.0.0.0/0` | Redirects to HTTPS |
| **HTTPS** | `443` | `0.0.0.0/0` | Secure SSL website traffic |

### Step 3: Allocate an Elastic IP (Static Public IP)
By default, EC2 IPs change on reboot. You need a persistent IP:
1. Go to **EC2 Dashboard** > **Elastic IPs** (under Network & Security).
2. Click **Allocate Elastic IP address** and click **Allocate**.
3. Select the allocated IP, click **Actions** > **Associate Elastic IP address**.
4. Associate it with your newly launched EC2 instance.

### Step 4: Point Your Domain (DNS Setup)
At your domain registrar (e.g., GoDaddy, Namecheap, Route 53), add the following:
*   **A Record**: `@` pointing to your **AWS Elastic IP**.
*   **A Record**: `www` pointing to your **AWS Elastic IP**.

---

## 3. Server Setup (Step-by-Step Commands)

### Step 1: Connect to your AWS Server
Open your local terminal and SSH into the instance using your key pair:
```bash
ssh -i /path/to/your-key.pem ubuntu@<your-elastic-ip>
```

### Step 2: Update Packages and Install Docker
Run these commands on the server to install the Docker engine and Docker Compose:
```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# 3. Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 4. Set up the stable repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Install Docker Engine and Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 6. Verify installation
sudo docker --version
sudo docker compose version
```

### Step 3: Allow Docker for non-root user (ubuntu)
This allows you to run docker commands without prefixing them with `sudo`:
```bash
sudo usermod -aG docker ubuntu
```
*Note: Log out and log back in for this change to take effect:*
```bash
exit
ssh -i /path/to/your-key.pem ubuntu@<your-elastic-ip>
```

---

## 4. Deploying the Application

### Step 1: Create the Project Directory
On the server, run:
```bash
sudo mkdir -p /opt/algonex
sudo chown -R ubuntu:ubuntu /opt/algonex
cd /opt/algonex
```

### Step 2: Transfer Files to the Server
From your **local machine's terminal** (in your project root directory), copy your code files to the EC2 server:
```bash
# 1. Zip the repository (excluding node_modules/venv/git files)
git archive --format=zip HEAD -o algonex.zip

# 2. Transfer the zip to your EC2 instance
scp -i /path/to/your-key.pem algonex.zip ubuntu@<your-elastic-ip>:/opt/algonex/

# 3. Transfer your .env file
scp -i /path/to/your-key.pem .env ubuntu@<your-elastic-ip>:/opt/algonex/
```

### Step 3: Unzip and Organize Files on EC2
Go back to your **EC2 SSH session** and unpack the repository:
```bash
cd /opt/algonex
sudo apt install -y unzip
unzip algonex.zip
rm algonex.zip
```

### Step 4: Configure the Production Environment Variables
Edit your `.env` file on the server to reflect production credentials:
```bash
nano /opt/algonex/.env
```
Ensure the following variables are configured correctly:
```bash
# Django Configuration
DJANGO_SECRET_KEY=generate-a-strong-random-key-here
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database Credentials
DB_NAME=algonex_prod
DB_USER=postgres
DB_PASSWORD=choose-a-strong-password-here
DB_HOST=db
DB_PORT=5432

# Domain Name (Used by Caddy for SSL)
DOMAIN=yourdomain.com
```
*(Press `Ctrl+O` then `Enter` to save, and `Ctrl+X` to exit).*

---

## 5. Build and Launch the Application

Run the following commands inside `/opt/algonex` on your EC2 instance:

### Step 1: Build Docker Images and Start Containers
```bash
docker compose -f docker-compose.yml up --build -d
```

### Step 2: Apply Database Migrations
```bash
docker compose exec backend python manage.py migrate --noinput
```

### Step 3: Seed Database Tables
```bash
docker compose exec backend python manage.py seed_courses
docker compose exec backend python manage.py seed_events
docker compose exec backend python manage.py seed_programs
docker compose exec backend python manage.py seed_showcase
docker compose exec backend python manage.py seed_careers
```

### Step 4: Create Django Admin Superuser
```bash
docker compose exec backend python manage.py createsuperuser
```
*(Follow the interactive prompts to create your admin username, email, and password).*

---

## 6. Verification & Troubleshooting

Check the status of your services:
```bash
# View active containers
docker compose ps

# View container output logs
docker compose logs -f --tail=50
```

### Common Issues:
1.  **SSL Errors / HTTPS fails to load**:
    *   Verify your domain points to the Elastic IP address (`ping yourdomain.com`).
    *   Check Caddy logs: `docker compose logs caddy`. Ensure port 80 and 443 are open in the EC2 security group rules.
2.  **Database Connection Failed**:
    *   Ensure `DB_HOST` in `/opt/algonex/.env` is set to `db` (the service name in docker-compose) rather than `localhost` or `127.0.0.1`.
3.  **Out of Memory (OOM) Errors**:
    *   If builds hang or crash, add a swapfile to the system to support memory operations:
        ```bash
        sudo fallocate -l 2G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        ```
