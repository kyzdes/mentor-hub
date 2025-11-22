# MentorHub Development Guide

Complete guide for developing MentorHub platform.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Development Workflow](#development-workflow)
- [Architecture](#architecture)
- [Database](#database)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

```bash
# Node.js 18+
node --version

# PostgreSQL 15+
psql --version

# Redis 7+
redis-cli --version

# npm 9+
npm --version
```

### Optional Tools

- Docker & Docker Compose
- Postman (API testing)
- Prisma Studio (database GUI)

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/mentor-hub.git
cd mentor-hub
```

### 2. Install Dependencies

```bash
# Install all dependencies (monorepo)
npm install
```

### 3. Setup Environment Variables

```bash
# Backend API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your settings

# Web App
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local
```

### 4. Setup Database

```bash
# Start PostgreSQL (if using Docker)
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# Run migrations
cd apps/api
npm run prisma:migrate
npm run prisma:generate
```

### 5. Start Development Servers

```bash
# Option 1: Start all services
npm run dev

# Option 2: Start individually
cd apps/api && npm run dev
cd apps/web && npm run dev
```

Access:
- **API**: http://localhost:3001/v1
- **API Docs**: http://localhost:3001/api/docs
- **Web App**: http://localhost:3000

## Development Workflow

### Creating a New Feature

1. Create feature branch
```bash
git checkout -b feature/feature-name
```

2. Develop feature with tests

3. Run tests and linting
```bash
npm test
npm run lint
```

4. Commit changes
```bash
git add .
git commit -m "feat: add feature description"
```

5. Push and create PR
```bash
git push origin feature/feature-name
```

## Architecture

### Monorepo Structure

```
mentor-hub/
├── apps/
│   ├── api/          # NestJS Backend
│   ├── web/          # Next.js Frontend
│   └── telegram-bot/ # Telegram Bot
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared UI components
│   └── utils/        # Shared utilities
└── docs/             # Documentation
```

### Backend (NestJS)

**Modules:**
- `auth` - Authentication & authorization
- `users` - User management
- `meeting-types` - Meeting types CRUD
- `availability` - Mentor availability
- `bookings` - Booking system
- `notifications` - Email/Push notifications
- `telegram` - Telegram bot integration

**Key Files:**
- `src/main.ts` - Application entry point
- `src/app.module.ts` - Root module
- `prisma/schema.prisma` - Database schema

### Frontend (Next.js)

**Pages:**
- `/` - Landing page
- `/book` - Public booking
- `/admin` - Admin dashboard
- `/auth` - Authentication

**Key Directories:**
- `src/app/` - Next.js pages (App Router)
- `src/components/` - React components
- `src/lib/` - Utilities & API client
- `src/hooks/` - Custom React hooks

## Database

### Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio (GUI)
npm run prisma:studio

# Reset database (DEV ONLY!)
npx prisma migrate reset
```

### Database Schema

Main entities:
- `User` - Mentors and mentees
- `MeetingType` - Types of meetings
- `MentorAvailability` - Recurring availability
- `AvailabilityException` - Blocked dates
- `Booking` - Meeting bookings
- `Notification` - Scheduled notifications

## API Development

### Adding a New Endpoint

1. Create DTO (Data Transfer Object)
```typescript
// dto/create-example.dto.ts
export class CreateExampleDto {
  @IsString()
  name: string;
}
```

2. Add service method
```typescript
// example.service.ts
async create(dto: CreateExampleDto) {
  return this.prisma.example.create({ data: dto });
}
```

3. Add controller endpoint
```typescript
// example.controller.ts
@Post()
create(@Body() dto: CreateExampleDto) {
  return this.service.create(dto);
}
```

4. Add to module
```typescript
// example.module.ts
@Module({
  controllers: [ExampleController],
  providers: [ExampleService],
})
export class ExampleModule {}
```

### Testing API

Use Swagger UI at http://localhost:3001/api/docs

Or use curl:
```bash
curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Frontend Development

### Adding a New Page

1. Create page file
```typescript
// src/app/example/page.tsx
export default function ExamplePage() {
  return <div>Example Page</div>;
}
```

2. Add to navigation (if needed)

3. Create components
```typescript
// src/components/example/example-card.tsx
export function ExampleCard() {
  return <div>...</div>;
}
```

### Using API Client

```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function ExampleComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['example'],
    queryFn: () => api.get('/example'),
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{data?.name}</div>;
}
```

## Testing

### Backend Tests

```bash
cd apps/api

# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend Tests

```bash
cd apps/web

# Jest tests
npm test

# With coverage
npm run test:cov
```

## Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**Database connection error**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker restart postgres
```

**Prisma Client not generated**
```bash
cd apps/api
npm run prisma:generate
```

**Module not found errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode

**Backend:**
```bash
npm run start:debug
# Then attach debugger to port 9229
```

**Frontend:**
```bash
# Add debugger; statement in code
# Open Chrome DevTools
```

## Performance Tips

1. Use Redis caching for frequently accessed data
2. Optimize database queries with proper indexes
3. Use React Query for client-side caching
4. Implement pagination for large lists
5. Use Next.js Image component for images
6. Enable compression for API responses

## Best Practices

### Code Style

- Use TypeScript strictly
- Follow ESLint rules
- Use Prettier for formatting
- Write descriptive variable names
- Add JSDoc comments for complex functions

### Git Workflow

- Create feature branches
- Write meaningful commit messages
- Keep commits atomic and focused
- Rebase instead of merge when appropriate
- Review your own PR before requesting review

### Security

- Never commit secrets or API keys
- Use environment variables
- Validate all user inputs
- Sanitize data before database queries
- Use parameterized queries (Prisma handles this)
- Implement rate limiting

---

Happy coding! 🚀
