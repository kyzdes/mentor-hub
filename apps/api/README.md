# MentorHub API

Backend API for MentorHub platform built with NestJS, PostgreSQL, and Prisma.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 15
- Redis >= 7

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### Development

```bash
# Start development server
npm run dev

# Run Prisma Studio (database GUI)
npm run prisma:studio
```

The API will be available at:
- API: http://localhost:3001/v1
- Swagger Docs: http://localhost:3001/api/docs

## 📁 Project Structure

```
src/
├── auth/               # Authentication & authorization
├── users/              # User management
├── meeting-types/      # Meeting types CRUD
├── availability/       # Mentor availability management
├── bookings/           # Booking system
├── notifications/      # Email & push notifications
├── telegram/           # Telegram bot integration
└── common/            # Shared utilities & modules
    └── prisma/        # Prisma ORM service
```

## 🔑 Key Features

- ✅ JWT Authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Meeting types management
- ✅ Availability & scheduling system
- ✅ Booking with conflict detection
- ✅ Email notifications (Bull Queue)
- ✅ Telegram bot integration
- ✅ PostgreSQL with Prisma ORM
- ✅ Redis caching
- ✅ Swagger API documentation

## 📚 API Documentation

After starting the server, visit http://localhost:3001/api/docs for interactive API documentation.

### Main Endpoints

**Authentication**
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login
- `POST /v1/auth/refresh` - Refresh access token
- `GET /v1/auth/me` - Get current user

**Meeting Types**
- `GET /v1/meeting-types` - List all meeting types
- `POST /v1/meeting-types` - Create meeting type
- `PATCH /v1/meeting-types/:id` - Update meeting type
- `DELETE /v1/meeting-types/:id` - Delete meeting type

**Availability**
- `GET /v1/availability` - Get availability
- `POST /v1/availability` - Add availability slot
- `GET /v1/availability/slots/:mentorId/:meetingTypeId` - Get available slots (PUBLIC)

**Bookings**
- `POST /v1/bookings` - Create booking (PUBLIC)
- `GET /v1/bookings` - List bookings
- `POST /v1/bookings/:id/approve` - Approve booking
- `POST /v1/bookings/:id/cancel` - Cancel booking
- `POST /v1/bookings/:id/reschedule` - Reschedule booking

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🔧 Database

```bash
# Create a new migration
npm run prisma:migrate

# Reset database (DEV ONLY!)
npx prisma migrate reset

# Seed database
npm run seed
```

## 🚢 Deployment

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis host
- `JWT_SECRET` - JWT signing secret
- `SMTP_*` - Email configuration
- `TELEGRAM_BOT_TOKEN` - Telegram bot token

## 📄 License

MIT
