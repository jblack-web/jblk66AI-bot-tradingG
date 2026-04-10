# jblk66AI – Deployment Guide

## Table of Contents

1. [Quick Start (Local Docker)](#1-quick-start-local-docker)
2. [Building & Pushing Images](#2-building--pushing-images)
3. [Docker Compose (Dev / Staging)](#3-docker-compose-dev--staging)
4. [Kubernetes Deployment](#4-kubernetes-deployment)
   - [AWS EKS](#41-aws-eks)
   - [GCP GKE](#42-gcp-gke)
   - [Azure AKS](#43-azure-aks)
   - [On-Premises](#44-on-premises)
5. [Post-Deploy Setup](#5-post-deploy-setup)
6. [Health Checks & Readiness Probes](#6-health-checks--readiness-probes)
7. [Scaling](#7-scaling)
8. [Rollback](#8-rollback)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Quick Start (Local Docker)

```bash
# 1. Clone the repo
git clone https://github.com/jblack-web/jblk66AI-bot-tradingG.git
cd jblk66AI-bot-tradingG

# 2. Create your local .env from the dev template
cp envs/.env.dev .env

# 3. Build and start all services
docker compose up --build

# 4. Verify services are healthy
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready

# 5. (First time only) Seed admin account
docker compose exec backend node ../scripts/setup-admin.js
```

The app will be available at **http://localhost** (Nginx proxy → frontend) and
the API at **http://localhost:3000/api**.

---

## 2. Building & Pushing Images

Replace `ghcr.io/jblack-web` with your own registry if needed.

```bash
# Backend
docker build -f docker/Dockerfile.backend -t ghcr.io/jblack-web/jblk66ai-backend:latest .
docker push ghcr.io/jblack-web/jblk66ai-backend:latest

# Frontend
docker build -f docker/Dockerfile.frontend -t ghcr.io/jblack-web/jblk66ai-frontend:latest .
docker push ghcr.io/jblack-web/jblk66ai-frontend:latest

# Nginx proxy (optional)
docker build -f docker/Dockerfile.nginx -t ghcr.io/jblack-web/jblk66ai-nginx:latest .
docker push ghcr.io/jblack-web/jblk66ai-nginx:latest
```

Tag a specific release version:

```bash
docker build -f docker/Dockerfile.backend \
  -t ghcr.io/jblack-web/jblk66ai-backend:v1.2.3 \
  -t ghcr.io/jblack-web/jblk66ai-backend:latest .
```

---

## 3. Docker Compose (Dev / Staging)

```bash
# Development
cp envs/.env.dev .env
docker compose up --build

# Staging (override compose file)
cp envs/.env.staging .env
docker compose -f docker-compose.yml up -d

# View logs
docker compose logs -f backend
docker compose logs -f worker

# Restart a single service
docker compose restart backend

# Stop everything
docker compose down

# Stop + remove volumes (destructive – wipes DB!)
docker compose down -v
```

---

## 4. Kubernetes Deployment

### Prerequisites

- `kubectl` configured and pointing at your cluster
- Container images pushed to a registry your cluster can pull from
- Edit `k8s/secret.yaml` with real base64-encoded secrets before applying

```bash
# Encode a secret value
echo -n 'my_password' | base64
```

### Apply all manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/mongo-statefulset.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Check rollout status
kubectl rollout status deployment/jblk66ai-backend -n jblk66ai
kubectl rollout status deployment/jblk66ai-frontend -n jblk66ai
```

---

### 4.1 AWS EKS

```bash
# Install eksctl
brew install eksctl        # macOS
# or: https://eksctl.io/installation/

# Create cluster (edit region/node type as needed)
eksctl create cluster \
  --name jblk66ai \
  --region us-east-1 \
  --nodegroup-name standard \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 8 \
  --managed

# Configure kubectl
aws eks update-kubeconfig --name jblk66ai --region us-east-1

# Install nginx-ingress-controller (AWS ALB alternative)
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# (Optional) cert-manager for automatic TLS
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true

# Deploy jblk66AI
kubectl apply -f k8s/

# Get the LoadBalancer address
kubectl get svc -n ingress-nginx ingress-nginx-controller

# Use AWS EBS for PersistentVolumes (update storageClassName in YAML)
# storageClassName: gp2   (EBS gp2)
# storageClassName: gp3   (EBS gp3 – preferred)
```

**Storage class update for EBS:**
In `k8s/mongo-statefulset.yaml` and `k8s/redis-deployment.yaml` change:
```yaml
storageClassName: gp3
```

---

### 4.2 GCP GKE

```bash
# Create cluster
gcloud container clusters create jblk66ai \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type e2-standard-2 \
  --enable-autoscaling --min-nodes 2 --max-nodes 8

# Configure kubectl
gcloud container clusters get-credentials jblk66ai --zone us-central1-a

# Install nginx-ingress
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# Deploy jblk66AI
kubectl apply -f k8s/

# Get external IP
kubectl get ingress jblk66ai-ingress -n jblk66ai
```

**Storage class for GKE:**
```yaml
storageClassName: standard-rwo   # GCP Persistent Disk (RWO)
```

---

### 4.3 Azure AKS

```bash
# Create resource group
az group create --name jblk66ai-rg --location eastus

# Create cluster
az aks create \
  --resource-group jblk66ai-rg \
  --name jblk66ai \
  --node-count 3 \
  --node-vm-size Standard_D2s_v3 \
  --enable-cluster-autoscaler \
  --min-count 2 --max-count 8 \
  --generate-ssh-keys

# Configure kubectl
az aks get-credentials --resource-group jblk66ai-rg --name jblk66ai

# Install nginx-ingress
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# Deploy jblk66AI
kubectl apply -f k8s/
```

**Storage class for AKS:**
```yaml
storageClassName: managed-premium   # Azure Premium SSD
```

---

### 4.4 On-Premises

```bash
# Install kubeadm cluster (single control-plane example)
kubeadm init --pod-network-cidr=10.244.0.0/16

# Install Flannel CNI
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

# Install nginx-ingress
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# Use local-path storage (Rancher local-path-provisioner)
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml

# Update storageClassName in manifests
# storageClassName: local-path

# Deploy jblk66AI
kubectl apply -f k8s/
```

---

## 5. Post-Deploy Setup

Run **once** after the very first deployment to seed the admin account and
default staking pools.

### With Docker Compose

```bash
docker compose exec backend \
  ADMIN_EMAIL=admin@yourdomain.com \
  ADMIN_PASSWORD='YourStr0ngP@ss!' \
  node /scripts/setup-admin.js
```

### With Kubernetes

```bash
kubectl run setup-admin \
  --image=ghcr.io/jblack-web/jblk66ai-backend:latest \
  --restart=Never \
  --namespace=jblk66ai \
  --env="MONGO_URI=$(kubectl get secret jblk66ai-secrets -n jblk66ai -o jsonpath='{.data.MONGO_URI}' | base64 -d)" \
  --env="ADMIN_EMAIL=admin@yourdomain.com" \
  --env="ADMIN_PASSWORD=YourStr0ngP@ss!" \
  -- node scripts/setup-admin.js

# Watch pod logs
kubectl logs -f setup-admin -n jblk66ai

# Clean up
kubectl delete pod setup-admin -n jblk66ai
```

### Seed templates (optional)

```bash
# Docker Compose
docker compose exec backend node seed/templateSeeder.js

# Kubernetes
kubectl exec -it deploy/jblk66ai-backend -n jblk66ai -- node seed/templateSeeder.js
```

### Initial onboarding checklist

1. ✅ Log in as admin at `/admin`
2. ✅ Change admin password immediately
3. ✅ Configure SMTP settings (Admin → Settings → Email)
4. ✅ Set Bitcoin price feed API key
5. ✅ Review and activate staking pools (Admin → Staking → Pools)
6. ✅ Configure KYC/AML thresholds (Admin → Compliance)
7. ✅ Test user registration and email verification
8. ✅ Configure referral program rates
9. ✅ Set up monitoring alerts

---

## 6. Health Checks & Readiness Probes

| Endpoint | Purpose | Expected Response |
|---|---|---|
| `GET /api/health` | Liveness – is process alive? | `{"status":"ok"}` 200 |
| `GET /api/ready` | Readiness – is DB connected? | `{"status":"ready"}` 200 |
| `GET /health` | Frontend/Nginx liveness | `{"status":"ok"}` 200 |

```bash
# Quick health check
curl -sf http://YOUR_HOST/api/health && echo "Backend OK"
curl -sf http://YOUR_HOST/api/ready && echo "Backend Ready"

# Kubernetes pod health
kubectl get pods -n jblk66ai
kubectl describe pod <pod-name> -n jblk66ai
```

---

## 7. Scaling

### Manual scaling

```bash
# Scale backend to 5 replicas
kubectl scale deployment jblk66ai-backend --replicas=5 -n jblk66ai

# Scale frontend
kubectl scale deployment jblk66ai-frontend --replicas=4 -n jblk66ai
```

### Horizontal Pod Autoscaler (already applied via `k8s/hpa.yaml`)

```bash
kubectl get hpa -n jblk66ai
kubectl describe hpa jblk66ai-backend-hpa -n jblk66ai
```

The HPA automatically scales based on CPU (>70%) and memory (>80%).

### Docker Compose scaling

```bash
docker compose up --scale backend=3 --scale frontend=2
```

---

## 8. Rollback

### Kubernetes

```bash
# View rollout history
kubectl rollout history deployment/jblk66ai-backend -n jblk66ai

# Rollback to previous version
kubectl rollout undo deployment/jblk66ai-backend -n jblk66ai

# Rollback to specific revision
kubectl rollout undo deployment/jblk66ai-backend --to-revision=2 -n jblk66ai

# Watch rollback progress
kubectl rollout status deployment/jblk66ai-backend -n jblk66ai
```

### Docker Compose

```bash
# Pin a previous image tag in docker-compose.yml, then
docker compose up -d --no-deps backend
```

---

## 9. Troubleshooting

### Pods not starting

```bash
kubectl get pods -n jblk66ai
kubectl describe pod <pod-name> -n jblk66ai
kubectl logs <pod-name> -n jblk66ai --previous
```

### Database connection failures

```bash
# Test connectivity from backend pod
kubectl exec -it deploy/jblk66ai-backend -n jblk66ai -- \
  node -e "const m=require('mongoose');m.connect(process.env.MONGO_URI).then(()=>console.log('OK')).catch(e=>console.error(e.message))"
```

### OOMKilled pods (out of memory)

Increase memory limit in `k8s/backend-deployment.yaml`:
```yaml
resources:
  limits:
    memory: 2Gi
```

### CrashLoopBackOff

```bash
# Check application logs
kubectl logs <pod-name> -n jblk66ai

# Common causes:
# - Missing environment variable → check secret/configmap
# - DB not reachable → check mongo/redis services
# - Bad image tag → check imagePullPolicy and registry credentials
```

### Ingress not routing

```bash
kubectl get ingress -n jblk66ai
kubectl describe ingress jblk66ai-ingress -n jblk66ai
kubectl get svc -n ingress-nginx
```

### Reset everything (Kubernetes)

```bash
# Delete all jblk66AI resources (keeps PVCs/data)
kubectl delete namespace jblk66ai

# Full reset including data (DESTRUCTIVE)
kubectl delete namespace jblk66ai
kubectl delete pvc -l app.kubernetes.io/name=jblk66ai -n jblk66ai
```
