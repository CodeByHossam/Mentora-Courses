# 🚀 Mentora Deployment Guide

[![Deployment Status](https://img.shields.io/badge/Deployment-Ready-green.svg)]()
[![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)]()
[![Cloud Ready](https://img.shields.io/badge/Cloud-AWS%20%7C%20Azure%20%7C%20GCP-orange.svg)]()
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-brightgreen.svg)]()

## 🎯 Overview

This comprehensive deployment guide covers multiple deployment strategies for the Mentora learning management system, from local development to enterprise-scale production deployments. Whether you're deploying to traditional servers, containers, or cloud platforms, this guide provides step-by-step instructions and best practices.

### 📋 Deployment Options
- **Traditional Server**: PM2 process management
- **Containerized**: Docker and Docker Compose
- **Cloud Platforms**: AWS, Azure, Google Cloud, Heroku
- **Kubernetes**: Enterprise-scale orchestration
- **CI/CD**: Automated deployment pipelines

## 📋 Prerequisites & System Requirements

### 🖥️ Minimum System Requirements

| Component | Minimum | Recommended | Enterprise |
|-----------|---------|-------------|------------|
| **CPU** | 2 cores | 4 cores | 8+ cores |
| **RAM** | 4GB | 8GB | 16GB+ |
| **Storage** | 20GB SSD | 100GB SSD | 500GB+ SSD |
| **Network** | 100 Mbps | 1 Gbps | 10 Gbps |
| **OS** | Ubuntu 18.04+ | Ubuntu 20.04+ | Ubuntu 22.04+ |

### 🛠️ Required Software Stack

| Software | Version | Purpose | Installation |
|----------|---------|---------|---------------|
| **Node.js** | 18.x LTS | Runtime environment | [Download](https://nodejs.org/) |
| **MongoDB** | 5.0+ | Primary database | [Installation Guide](https://docs.mongodb.com/manual/installation/) |
| **Redis** | 6.0+ | Caching & sessions | [Installation Guide](https://redis.io/download) |
| **Nginx** | 1.18+ | Reverse proxy | `sudo apt install nginx` |
| **PM2** | Latest | Process management | `npm install -g pm2` |
| **Docker** | 20.10+ | Containerization | [Docker Install](https://docs.docker.com/get-docker/) |

### ☁️ External Services

| Service | Provider | Purpose | Required |
|---------|----------|---------|----------|
| **File Storage** | Cloudinary | Media management | ✅ Yes |
| **Email Service** | SendGrid/AWS SES | Notifications | ✅ Yes |
| **Monitoring** | DataDog/New Relic | Performance monitoring | 📋 Recommended |
| **CDN** | CloudFlare/AWS CloudFront | Content delivery | 📋 Recommended |
| **SSL Certificate** | Let's Encrypt/CloudFlare | HTTPS encryption | ✅ Yes |

## ⚙️ Environment Configuration

### 🔧 Production Environment Variables

Create a comprehensive `.env` file based on `.env.example`:

```bash
# ==========================================
# CORE APPLICATION SETTINGS
# ==========================================
NODE_ENV=production
PORT=5000
APP_NAME=Mentora
APP_VERSION=1.0.0
APP_URL=https://mentora.com
API_URL=https://api.mentora.com

# ==========================================
# DATABASE CONFIGURATION
# ==========================================
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/Mentora?retryWrites=true&w=majority
MONGO_DB_NAME=Mentora_production
DB_CONNECTION_TIMEOUT=30000
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=5

# ==========================================
# AUTHENTICATION & SECURITY
# ==========================================
JWT_SECRET=your-super-secure-jwt-secret-min-32-characters
JWT_REFRESH_SECRET=your-refresh-token-secret-different-from-jwt
JWT_EXPIRE_TIME=15m
JWT_REFRESH_EXPIRE_TIME=7d
PASSWORD_SALT_ROUNDS=12
SESSION_SECRET=your-session-secret-key

# ==========================================
# EXTERNAL SERVICES
# ==========================================
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
CLOUDINARY_SECURE=true

# Email Service (SendGrid)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@mentora.com
EMAIL_FROM_NAME=Mentora Platform

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_TTL=3600

# ==========================================
# SECURITY & RATE LIMITING
# ==========================================
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://Mentora.com,https://app.Mentora.com
TRUSTED_PROXIES=cloudflare
SECURE_COOKIES=true
SAME_SITE_COOKIES=strict

# ==========================================
# FILE UPLOAD LIMITS
# ==========================================
MAX_FILE_SIZE=52428800  # 50MB
MAX_IMAGE_SIZE=10485760  # 10MB
MAX_VIDEO_SIZE=104857600  # 100MB
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/ogg

# ==========================================
# MONITORING & LOGGING
# ==========================================
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
ERROR_LOG_PATH=./logs/error.log
MONITORING_ENABLED=true
SENTRY_DSN=your-sentry-dsn-url

# ==========================================
# PERFORMANCE & CACHING
# ==========================================
CACHE_ENABLED=true
CACHE_TTL=3600
COMPRESSION_ENABLED=true
CDN_URL=https://cdn.Mentora.com

# ==========================================
# FEATURE FLAGS
# ==========================================
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
ENABLE_FILE_SCANNING=true
MAINTENANCE_MODE=false
```

### 🔐 Environment Security Checklist

- [ ] All secrets are randomly generated (min 32 characters)
- [ ] No hardcoded credentials in source code
- [ ] Environment variables are properly escaped
- [ ] Production and development environments are separated
- [ ] Secrets are stored in secure vaults (AWS Secrets Manager, etc.)
- [ ] Environment files are added to `.gitignore`
- [ ] Regular rotation of secrets and API keys

## 🔧 Pre-Deployment Preparation

### 1. Database Migration
Run the video migration script to update existing data:

```bash
# Navigate to server directory
cd server

# Run migration
node migrations/videoMigration.js

# To rollback (if needed)
node migrations/videoMigration.js rollback
```

### 2. Install Dependencies

**Backend:**
```bash
cd server
npm install --production
```

**Frontend:**
```bash
cd client
npm install
npm run build
```

### 3. Security Configuration
Ensure all security middleware is properly configured:
- Rate limiting enabled
- CORS configured for production domains
- Helmet security headers active
- Input sanitization enabled

## 🚀 Production Deployment Strategies

### 🖥️ Option 1: Traditional Server Deployment with PM2

#### 1. Server Setup
```bash
# Install PM2 for process management
npm install -g pm2

# Create PM2 ecosystem file
# See ecosystem.config.js example below
```

#### 2. PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'Mentora-api',
    script: './server/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### 3. Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### 🐳 Option 2: Containerized Deployment with Docker

#### 1. Backend Dockerfile
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

#### 2. Frontend Dockerfile
```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Docker Compose
```yaml
version: '3.8'
services:
  api:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
      - redis

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - api

  mongodb:
    image: mongo:5.0
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASS}

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

### ☁️ Option 3: Cloud Platform Deployment

#### 1. Heroku Setup
```bash
# Install Heroku CLI
# Create Heroku app
heroku create Mentora-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set MONGO_URI=your-mongodb-uri
# ... set all required env vars

# Deploy
git push heroku main
```

#### 2. Procfile
```
web: node server/server.js
```

## ⚡ Post-Deployment Optimization & Configuration

### 1. Database Indexing
Create necessary database indexes for performance:

```javascript
// Run in MongoDB shell
db.courses.createIndex({ title: "text", description: "text" });
db.courses.createIndex({ category: 1, level: 1 });
db.courses.createIndex({ instructor: 1 });
db.users.createIndex({ email: 1 }, { unique: true });
db.lessons.createIndex({ course: 1, order: 1 });
```

### 2. SSL Certificate
Configure SSL certificate for HTTPS:
- Use Let's Encrypt for free certificates
- Configure reverse proxy (Nginx) for SSL termination
- Update CORS settings for HTTPS domains

### 3. Monitoring Setup
Configure monitoring and logging:
- Set up error tracking (Sentry, Bugsnag)
- Configure log aggregation (ELK stack, Splunk)
- Set up uptime monitoring
- Configure performance monitoring (New Relic, DataDog)

## 🔒 Comprehensive Security Checklist

### Pre-Production Security
- [ ] All environment variables secured
- [ ] Database connection encrypted
- [ ] JWT secrets are strong and unique
- [ ] Rate limiting configured
- [ ] Input validation enabled
- [ ] CORS properly configured
- [ ] Security headers enabled (Helmet)
- [ ] File upload restrictions in place
- [ ] SQL injection protection active
- [ ] XSS protection enabled

### Production Security
- [ ] SSL/TLS certificate installed
- [ ] Firewall configured
- [ ] Database access restricted
- [ ] Admin endpoints secured
- [ ] Error messages sanitized
- [ ] Logging configured (no sensitive data)
- [ ] Backup strategy implemented
- [ ] Incident response plan ready

## 🚄 Performance Optimization Guide

### Database Optimization
- Enable MongoDB connection pooling
- Configure appropriate indexes
- Implement query optimization
- Set up database monitoring

### Application Optimization
- Enable gzip compression
- Configure caching headers
- Implement Redis caching
- Optimize image delivery (Cloudinary)
- Enable CDN for static assets

### Frontend Optimization
- Bundle optimization (code splitting)
- Image lazy loading
- Service worker for caching
- Performance monitoring

## 💾 Comprehensive Backup & Recovery Strategy

### Database Backup
```bash
# Automated MongoDB backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGO_URI" --out="/backups/mongodb_$DATE"
```

### File Storage Backup
- Configure Cloudinary backup policies
- Implement automated backup verification
- Set up cross-region replication

## 📊 Monitoring, Logging & Maintenance

### Health Checks
Create health check endpoints:
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### Log Management
Configure structured logging:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔧 Troubleshooting & Diagnostics

### Common Issues
1. **Video streaming not working**: Check Cloudinary configuration and JWT secrets
2. **Database connection issues**: Verify MongoDB URI and network access
3. **File upload failures**: Check Cloudinary credentials and file size limits
4. **Authentication problems**: Verify JWT secrets and token expiration

### Debug Commands
```bash
# Check application logs
pm2 logs Mentora-api

# Monitor system resources
pm2 monit

# Restart application
pm2 restart Mentora-api

# Check database connection
mongo $MONGO_URI --eval "db.adminCommand('ismaster')"
```

## ↩️ Emergency Rollback Procedures

### Application Rollback
```bash
# Using PM2
pm2 stop Mentora-api
# Deploy previous version
pm2 start Mentora-api

# Using Docker
docker-compose down
# Switch to previous image version
docker-compose up -d
```

### Database Rollback
```bash
# Restore from backup
mongorestore --uri="$MONGO_URI" /backups/mongodb_backup_date

# Run rollback migration if needed
node migrations/videoMigration.js rollback
```

## 🛠️ Ongoing Support & Maintenance

### 📅 Maintenance Schedule

| Frequency | Task | Owner | Automation |
|-----------|------|-------|------------|
| **Daily** | Health checks & log review | DevOps | ✅ Automated |
| **Weekly** | Security updates & patches | Security Team | 🔄 Semi-automated |
| **Monthly** | Dependency updates | Development Team | 🔄 Semi-automated |
| **Quarterly** | Performance optimization | DevOps + Dev Team | 📋 Manual |
| **Annually** | Infrastructure review | Architecture Team | 📋 Manual |

### 📞 Support Contacts

| Role | Contact | Availability | Purpose |
|------|---------|--------------|----------|
| **DevOps Lead** | devops@Mentora.com | 24/7 | Infrastructure issues |
| **Development Team** | dev@Mentora.com | Business hours | Application bugs |
| **Security Team** | security@Mentora.com | 24/7 | Security incidents |
| **Emergency Hotline** | +1-555-DEPLOY-1 | 24/7 | Critical system failures |

### 🚨 Escalation Matrix

1. **Level 1**: Automated monitoring alerts
2. **Level 2**: On-call engineer notification
3. **Level 3**: Team lead escalation
4. **Level 4**: Management and stakeholder notification

### 📚 Additional Resources

- **Documentation Wiki**: [https://wiki.Mentora.com](https://wiki.Mentora.com)
- **Status Page**: [https://status.Mentora.com](https://status.Mentora.com)
- **Deployment Logs**: [https://logs.Mentora.com](https://logs.Mentora.com)
- **Monitoring Dashboard**: [https://monitoring.Mentora.com](https://monitoring.Mentora.com)

---

**Document Version**: 2.0  
**Last Updated**: September 2023  
**Next Review**: December 2023  
**Maintained By**: DevOps Team  

*For urgent deployment issues, please use the emergency hotline or contact the on-call engineer directly.*


---

# Rollback Plan (consolidated)


# Rollback Plan

## Scope
Rollback guidance for Mentora optimization phases (0-5).

## Triggers
- Health check `/api/health` fails or DB disconnected.
- Payment/checkout flows return 5xx.
- Client build/runtime errors.

## Steps
1. Revert application code to previous release tag/commit.
2. Restore environment variables from backup (`.env`).
3. Restart server: `npm start` (port 5000).
4. Rebuild client: `npm run build` in `client/`.
5. Verify health: `GET /api/health` returns 200.
6. Run smoke tests: login, course list, payment initiation, certificate.

## Database
- No destructive migrations were applied; collections remain compatible.
- If needed, restore MongoDB from backup snapshot.

## Cache
- In-memory cache clears on process restart; no persistent cache to invalidate.

## Notes
- Keep `AUTO_COMPLETE_PAYMENTS` disabled in production.
- Monitor logs for 30 minutes after rollback.


---

# Performance Notes (consolidated)


# Mentora-Courses — Performance Report

## Build (Vite)
- Main JS: ~1,229 kB (gzip ~283 kB)
- Multiple route chunks split (good)
- CSS included in build

## Findings
- Large main chunk; consider manualChunks for vendor libs (React, Redux, Stripe, Zoom).
- Route-level splitting exists but vendor bundling is heavy.

## Recommendations
- Configure `rollupOptions.output.manualChunks` to split vendors
- Lazy-load Zoom/WebSDK and Stripe components
- Optimize images/assets, use compression
- Add preconnect/prefetch for critical resources
