# MentorHub Deployment Guide

## 📋 Prerequisites

### Required Services
- PostgreSQL 15+ database
- Redis 7+ instance
- SMTP server (for emails)
- Domain name
- SSL certificate

### Optional Services
- AWS S3 or Cloudflare R2 (file storage)
- Sentry (error tracking)
- PostHog/Mixpanel (analytics)

## 🚀 Deployment Options

### Option 1: Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec api npm run prisma:migrate

# View logs
docker-compose logs -f
```

### Option 2: Manual Deployment

#### Backend API

1. **Setup Database**
```bash
# Create PostgreSQL database
createdb mentorhub_prod

# Set DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/mentorhub_prod"
```

2. **Install Dependencies**
```bash
cd apps/api
npm install
```

3. **Run Migrations**
```bash
npm run prisma:migrate
npm run prisma:generate
```

4. **Build & Start**
```bash
npm run build
npm run start:prod
```

#### Web Application

1. **Install Dependencies**
```bash
cd apps/web
npm install
```

2. **Build**
```bash
npm run build
```

3. **Start**
```bash
npm start
```

## ⚙️ Environment Variables

### Backend (apps/api/.env)

```env
# Application
NODE_ENV=production
PORT=3001
API_PREFIX=v1

# Database
DATABASE_URL="postgresql://user:password@host:5432/mentorhub"

# Redis
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_URL=https://api.yourdomain.com/telegram/webhook

# URLs
WEB_APP_URL=https://yourdomain.com
```

### Frontend (apps/web/.env.local)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/v1
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 🌐 Hosting Providers

### Recommended Setups

#### 1. Vercel (Frontend) + Railway (Backend)
- **Frontend**: Deploy web app to Vercel
- **Backend**: Deploy API to Railway
- **Database**: Railway PostgreSQL
- **Redis**: Railway Redis

#### 2. AWS
- **Frontend**: S3 + CloudFront
- **Backend**: ECS or EC2
- **Database**: RDS PostgreSQL
- **Redis**: ElastiCache
- **Storage**: S3

#### 3. DigitalOcean
- **App Platform** for both frontend and backend
- **Managed PostgreSQL**
- **Managed Redis**

## 📊 Monitoring

### Setup Sentry (Error Tracking)

```bash
# Install Sentry
npm install @sentry/node @sentry/nextjs

# Add to .env
SENTRY_DSN=your-sentry-dsn
```

### Setup Health Checks

The API exposes a health check endpoint:
```
GET /health
```

## 🔒 Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set strong JWT secrets
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Use environment variables for secrets
- [ ] Enable database connection pooling
- [ ] Set up logging and monitoring

## 🔄 CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Your deployment commands
```

## 📈 Performance Optimization

- Enable Redis caching
- Use CDN for static assets
- Optimize images (Next.js Image component)
- Enable compression
- Use connection pooling for database
- Set up horizontal scaling (if needed)

## 🔧 Maintenance

### Database Backups
```bash
# Backup PostgreSQL
pg_dump -U user mentorhub > backup.sql

# Restore
psql -U user mentorhub < backup.sql
```

### Logs
```bash
# View API logs
docker-compose logs -f api

# View web logs
docker-compose logs -f web
```

## 📞 Support

For deployment issues, check:
1. Logs for errors
2. Environment variables are set correctly
3. Database migrations have run
4. Redis connection is working
5. SMTP settings are correct

---

Good luck with your deployment! 🚀
