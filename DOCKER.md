# Docker Deployment Guide

## Overview

This application includes production-ready Docker configurations for both the backend API and frontend application. These configurations are optimized for cloud deployments (Google Cloud Run, AWS ECS, Azure Container Instances) and use multi-stage builds for minimal image sizes.

## ⚠️ AWS Workspace Limitation

**Note**: These Docker files cannot be tested locally on AWS Workspaces due to nested virtualization limitations. They are designed for deployment in cloud environments or on local machines with Docker support.

---

## 📦 What's Included

### Backend API (`tech-spec-generator-api/`)
- `Dockerfile` - Multi-stage Node.js/Express API build
- `.dockerignore` - Optimized build context
- Health check endpoint at `/api/health`

### Frontend (`tech-spec-generator/`)
- `Dockerfile` - Multi-stage React/Vite + nginx build
- `.dockerignore` - Optimized build context
- `nginx.conf` - Production nginx configuration
- Health check endpoint at `/health`

### Orchestration
- `docker-compose.yml` - Full stack orchestration with PostgreSQL

---

## 🏗️ Architecture

### Backend Dockerfile (Multi-Stage)
1. **Builder Stage**: Installs dependencies, generates Prisma client, builds TypeScript
2. **Production Stage**: Minimal runtime with only production dependencies
   - Base: `node:20-alpine`
   - Non-root user: `nodejs:1001`
   - Signal handling: `dumb-init`
   - Port: `3001` (configurable via `PORT` env var)

### Frontend Dockerfile (Multi-Stage)
1. **Builder Stage**: Installs dependencies, builds Vite app
2. **Production Stage**: nginx serves static assets
   - Base: `nginx:alpine`
   - Non-root user: `nginx-user:1001`
   - Signal handling: `dumb-init`
   - Port: `8080`

---

## 🚀 Deployment Options

### Option 1: Google Cloud Run (Recommended)

#### Backend API
```bash
cd tech-spec-generator-api

# Build and tag
docker build --platform linux/amd64 \
  --build-arg NPM_TOKEN=${GITHUB_PAT} \
  -t gcr.io/PROJECT_ID/tech-spec-api:latest .

# Push to GCR
docker push gcr.io/PROJECT_ID/tech-spec-api:latest

# Deploy to Cloud Run
gcloud run deploy tech-spec-api \
  --image gcr.io/PROJECT_ID/tech-spec-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=postgresql://...,NODE_ENV=production" \
  --set-secrets="DATABASE_URL=tech-spec-db-url:latest" \
  --vpc-connector=your-vpc-connector \
  --service-account=tech-spec-sa@PROJECT_ID.iam.gserviceaccount.com
```

#### Frontend
```bash
cd tech-spec-generator

# Build with API URL
docker build --platform linux/amd64 \
  --build-arg VITE_API_URL=https://tech-spec-api-xxx.run.app \
  --build-arg GEMINI_API_KEY=${GEMINI_API_KEY} \
  -t gcr.io/PROJECT_ID/tech-spec-frontend:latest .

# Push to GCR
docker push gcr.io/PROJECT_ID/tech-spec-frontend:latest

# Deploy to Cloud Run
gcloud run deploy tech-spec-frontend \
  --image gcr.io/PROJECT_ID/tech-spec-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

---

### Option 2: Docker Compose (For Testing in Supported Environments)

```bash
# Set environment variables
export GEMINI_API_KEY=your_key_here
export DB_PASSWORD=your_secure_password

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

**Ports:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

---

### Option 3: Individual Container Deployment

#### Run Backend
```bash
# Create network
docker network create tech-spec-network

# Run PostgreSQL
docker run -d \
  --name tech-spec-db \
  --network tech-spec-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=tech_spec_gen \
  -p 5432:5432 \
  postgres:16-alpine

# Build backend
cd tech-spec-generator-api
docker build -t tech-spec-api .

# Run backend
docker run -d \
  --name tech-spec-api \
  --network tech-spec-network \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://postgres:your_password@tech-spec-db:5432/tech_spec_gen \
  -e FRONTEND_URL=http://localhost:3000 \
  tech-spec-api
```

#### Run Frontend
```bash
# Build frontend
cd tech-spec-generator
docker build \
  --build-arg VITE_API_URL=http://localhost:3001 \
  --build-arg GEMINI_API_KEY=your_key \
  -t tech-spec-frontend .

# Run frontend
docker run -d \
  --name tech-spec-frontend \
  --network tech-spec-network \
  -p 3000:8080 \
  tech-spec-frontend
```

---

## 🔐 Security Considerations

### 1. Private NPM Packages
Both Dockerfiles include `.npmrc` for accessing `@asp-utilities` private packages. Ensure your `.npmrc` contains a valid GitHub PAT.

```bash
# .npmrc should contain:
@asp-utilities:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

### 2. Secrets Management

**Development/Testing:**
- Use environment variables
- Use `.env` files (not committed to git)

**Production:**
- Use Google Secret Manager (GCP)
- Use AWS Secrets Manager (AWS)
- Use Azure Key Vault (Azure)

### 3. Non-Root Users
Both images run as non-root users for security:
- Backend: `nodejs:1001`
- Frontend: `nginx-user:1001`

### 4. Health Checks
Both images include health checks:
- Backend: `/api/health` endpoint
- Frontend: `/health` endpoint

---

## 📊 Image Sizes (Approximate)

- **Backend**: ~150MB (Alpine + Node.js runtime + compiled app)
- **Frontend**: ~25MB (Alpine + nginx + static assets)
- **Total**: ~175MB

Multi-stage builds ensure minimal production images by excluding:
- Development dependencies
- Source code
- Build tools
- Documentation

---

## 🛠️ Build Arguments

### Backend
No build arguments required (uses environment variables at runtime)

### Frontend
- `VITE_API_URL` - Backend API URL (required)
- `VITE_SERVICE_NAME` - Service name for logging (default: `tech-spec-generator`)
- `GEMINI_API_KEY` - Gemini API key (required)

---

## 🔧 Environment Variables

### Backend (Runtime)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `FRONTEND_URL` | Yes | - | CORS allowed origin |
| `SERVICE_NAME` | No | `tech-spec-generator-api` | Logger service name |
| `LOG_LEVEL` | No | `info` | Log level |
| `GCP_PROJECT_ID` | No | - | GCP project for Cloud SQL |

### Frontend (Build Time)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | - | Backend API URL |
| `VITE_SERVICE_NAME` | No | `tech-spec-generator` | Logger service name |
| `GEMINI_API_KEY` | Yes | - | Gemini API key |

---

## 📝 Troubleshooting

### Build Fails with NPM Authentication Error
**Problem**: Cannot access `@asp-utilities` packages

**Solution**:
1. Ensure `.npmrc` exists in project root
2. Verify GitHub PAT has `read:packages` permission
3. Check PAT is not expired

```bash
# Test locally
npm install @asp-utilities/tooling-node-logger
```

### Backend Cannot Connect to Database
**Problem**: `ECONNREFUSED` or `Connection timeout`

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Check database is running and accessible
3. For docker-compose, ensure `depends_on` with health check
4. For Cloud Run, verify VPC connector and Cloud SQL configuration

### Frontend Shows API Errors
**Problem**: CORS errors or connection refused

**Solution**:
1. Verify `VITE_API_URL` was set during build
2. Check backend `FRONTEND_URL` allows frontend origin
3. Ensure backend is running and accessible

### Health Checks Failing
**Problem**: Container restarts due to failed health checks

**Solution**:
1. Check application logs: `docker logs <container>`
2. Verify health endpoint is accessible internally
3. Increase `start_period` if app takes longer to start

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup GCP
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      
      - name: Configure Docker
        run: gcloud auth configure-docker
      
      - name: Build Backend
        run: |
          cd tech-spec-generator-api
          echo "${{ secrets.NPM_TOKEN }}" > .npmrc
          docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/tech-spec-api:${{ github.sha }} .
          docker tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/tech-spec-api:${{ github.sha }} gcr.io/${{ secrets.GCP_PROJECT_ID }}/tech-spec-api:latest
      
      - name: Push to GCR
        run: |
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/tech-spec-api:${{ github.sha }}
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/tech-spec-api:latest
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy tech-spec-api \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/tech-spec-api:latest \
            --region us-central1 \
            --platform managed
```

---

## 📚 Additional Resources

- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [nginx Configuration](https://nginx.org/en/docs/)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

---

## 🆘 Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Review security/networking settings
5. Consult cloud provider documentation

---

**Last Updated**: October 31, 2024

