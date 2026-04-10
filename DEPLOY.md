# jblk66AI – Deploy in 5 Steps

This guide covers the fastest path to a running production instance using **Docker Compose** on a single server (VPS, cloud VM, or bare-metal).  
For Kubernetes and cloud-managed clusters, see [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md).

---

## Prerequisites

| Tool | Minimum version | Install guide |
|---|---|---|
| Docker Engine | 24+ | https://docs.docker.com/engine/install/ |
| Docker Compose | v2 (bundled) | https://docs.docker.com/compose/install/ |
| Node.js | 18+ (local build only) | https://nodejs.org |

---

## Option A — Upload the pre-built archive

### 1. Create the archive (on your dev machine)

```bash
bash scripts/bundle.sh v1.0.0        # creates  jblk66ai-v1.0.0.tar.gz
```

### 2. Copy it to your server

```bash
scp jblk66ai-v1.0.0.tar.gz user@YOUR_SERVER_IP:/opt/jblk66ai/
```

### 3. Extract on the server

```bash
ssh user@YOUR_SERVER_IP
mkdir -p /opt/jblk66ai
cd /opt/jblk66ai
tar -xzf jblk66ai-v1.0.0.tar.gz
```

### 4. Configure environment

```bash
cp envs/.env.prod .env
nano .env          # fill in every REPLACE_WITH_* value (see table below)
```

| Variable | What to set |
|---|---|
| `MONGO_URI` | Your MongoDB connection string |
| `MONGO_ROOT_USER` | MongoDB admin username |
| `MONGO_ROOT_PASSWORD` | MongoDB admin password (strong) |
| `REDIS_PASSWORD` | Redis password (strong) |
| `JWT_SECRET` | Random 64-char string (`openssl rand -hex 32`) |
| `ADMIN_EMAIL` | First admin login email |
| `ADMIN_PASSWORD` | First admin login password |
| `SMTP_HOST/USER/PASS` | Your email provider credentials |
| `COINMARKETCAP_API_KEY` | CoinMarketCap API key |

### 5. Start the stack

```bash
cd /opt/jblk66ai
docker compose up -d --build
```

Check that everything is running:

```bash
docker compose ps
curl http://localhost:3000/api/health   # → {"status":"ok"}
curl http://localhost:3000/api/ready    # → {"status":"ready"}
```

### 6. Seed the admin account (first time only)

```bash
docker compose exec backend node scripts/setup-admin.js
```

> The script is **idempotent** — safe to re-run; it skips creation if the admin already exists.

---

## Option B — Clone from GitHub (no archive needed)

```bash
git clone https://github.com/jblack-web/jblk66AI-bot-tradingG.git
cd jblk66AI-bot-tradingG
cp envs/.env.prod .env
nano .env                              # fill in secrets (see table above)
docker compose up -d --build
docker compose exec backend node scripts/setup-admin.js
```

---

## Useful commands

```bash
# View live logs
docker compose logs -f backend

# Restart a service
docker compose restart backend

# Stop everything (data preserved)
docker compose down

# Stop + wipe volumes — DESTRUCTIVE, deletes database
docker compose down -v

# Update to a new version
git pull                               # or extract a new archive
docker compose up -d --build
```

---

## Ports & URLs

| Service | Port | URL |
|---|---|---|
| Nginx (reverse proxy) | 80 | http://YOUR_SERVER_IP |
| Backend API | 3000 | http://YOUR_SERVER_IP:3000/api |
| Admin dashboard | — | http://YOUR_SERVER_IP/admin |

> To enable HTTPS, add a TLS certificate via Certbot or place your cert in `nginx/certs/` and update `nginx/conf.d/default.conf`.

---

## Post-launch checklist

1. ✅ Log in at `/admin` and change the admin password
2. ✅ Configure SMTP (Admin → Settings → Email) and send a test email
3. ✅ Set Bitcoin price feed API key
4. ✅ Review and activate staking pools (Admin → Staking → Pools)
5. ✅ Test user registration and email verification
6. ✅ Point your domain's DNS `A` record to `YOUR_SERVER_IP`
7. ✅ Enable HTTPS

---

## Troubleshooting

**Services not starting?**
```bash
docker compose logs backend
docker compose logs mongo
```

**Cannot connect to MongoDB?**
Check that `MONGO_URI` in `.env` matches the `mongo` service hostname used in `docker-compose.yml`.

**Port 80/3000 already in use?**
```bash
sudo ss -tlnp | grep ':80\|:3000'
```
Stop the conflicting process, then re-run `docker compose up -d`.

For complete troubleshooting, rollback, scaling, and Kubernetes deployment, see  
[`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md).
