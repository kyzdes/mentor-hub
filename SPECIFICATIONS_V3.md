# MentorHub v3.0 - Architectural & Functional Specifications
## Technical Implementation Guide

**Document Version**: 1.0
**Date**: 2025-11-23
**Status**: Draft for Review
**Target Audience**: Engineering Team, Product Managers, Technical Architects

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Schema Design](#2-database-schema-design)
3. [API Specifications](#3-api-specifications)
4. [AI/ML Implementation](#4-aiml-implementation)
5. [Video System Architecture](#5-video-system-architecture)
6. [Multi-Tenancy Design](#6-multi-tenancy-design)
7. [Mobile App Architecture](#7-mobile-app-architecture)
8. [Security & Compliance](#8-security--compliance)
9. [Performance Requirements](#9-performance-requirements)
10. [Deployment Strategy](#10-deployment-strategy)

---

## 1. System Architecture

### 1.1 High-Level Architecture

#### Current State (v2.0)
```
┌─────────────┐
│   Next.js   │
│   (Web App) │
└──────┬──────┘
       │
┌──────▼──────────┐
│   NestJS API    │
│   (Monolithic)  │
└──────┬──────────┘
       │
┌──────▼──────────┐
│   PostgreSQL    │
└─────────────────┘
```

#### Target State (v3.0)
```
                    ┌──────────────────┐
                    │   Cloudflare     │
                    │   (CDN + WAF)    │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐       ┌──────▼──────┐    ┌──────▼──────┐
    │Next.js  │       │React Native │    │  Partners   │
    │Web App  │       │iOS + Android│    │  (API Keys) │
    └────┬────┘       └──────┬──────┘    └──────┬──────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Kong Gateway   │
                    │   (API Gateway)  │
                    └────────┬─────────┘
                             │
         ┌───────────────────┴────────────────────┬──────────────┐
         │                   │                    │              │
    ┌────▼────┐      ┌───────▼───────┐    ┌──────▼──────┐  ┌───▼────┐
    │  Auth   │      │    Booking    │    │   Payment   │  │  Video │
    │ Service │      │    Service    │    │   Service   │  │Service │
    └────┬────┘      └───────┬───────┘    └──────┬──────┘  └───┬────┘
         │                   │                    │             │
    ┌────▼────┐      ┌───────▼───────┐    ┌──────▼──────┐  ┌───▼────┐
    │Messaging│      │Gamification   │    │     AI      │  │Analytics│
    │ Service │      │    Service    │    │   Service   │  │Service │
    └────┬────┘      └───────┬───────┘    └──────┬──────┘  └───┬────┘
         │                   │                    │             │
         └───────────────────┴────────────────────┴─────────────┘
                                      │
         ┌────────────────────────────┴─────────────────────────┐
         │                    │                 │                │
    ┌────▼─────┐      ┌───────▼───────┐  ┌─────▼──────┐  ┌─────▼─────┐
    │PostgreSQL│      │     Redis     │  │Elasticsearch│  │ClickHouse │
    │(Primary) │      │(Cache/Queue)  │  │  (Search)   │  │(Analytics)│
    └──────────┘      └───────────────┘  └────────────┘  └───────────┘
```

### 1.2 Microservices Breakdown

#### Auth Service
**Responsibilities**:
- User registration, login, logout
- JWT token generation and validation
- Refresh token management
- 2FA/MFA handling
- OAuth integrations (Google, GitHub, LinkedIn)
- SSO for enterprise (SAML)

**Tech Stack**:
- NestJS + Passport.js
- bcrypt for hashing
- jsonwebtoken
- PostgreSQL for user data
- Redis for sessions/blacklist

**API Endpoints**:
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/verify-email
POST   /auth/reset-password
POST   /auth/2fa/enable
POST   /auth/2fa/verify
GET    /auth/me
POST   /auth/oauth/:provider
```

**Database Schema**:
```prisma
model User {
  id               String    @id @default(uuid())
  email            String    @unique
  passwordHash     String
  emailVerified    Boolean   @default(false)
  twoFactorEnabled Boolean   @default(false)
  twoFactorSecret  String?   @db.Text
  // ... other fields
}

model RefreshToken {
  id          String   @id @default(uuid())
  userId      String
  token       String   @unique @db.Text
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}

model PasswordReset {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

#### AI Service (Python FastAPI)
**Responsibilities**:
- Mentor-mentee matching algorithm
- Session transcription & summarization
- Sentiment analysis
- Predictive analytics
- Knowledge graph generation
- Content moderation

**Tech Stack**:
- Python 3.11+ with FastAPI
- TensorFlow / PyTorch for ML models
- Sentence Transformers for embeddings
- FAISS for vector similarity search
- OpenAI API for GPT-4
- Deepgram for speech-to-text
- Celery for async tasks
- PostgreSQL for training data

**Architecture**:
```python
/ai-service/
  /app/
    /models/          # ML models
      matching.py     # Matching algorithm
      sentiment.py    # Sentiment analysis
      summarization.py # GPT-4 summarization
    /services/
      embedding.py    # Generate embeddings
      vector_search.py # FAISS operations
      training.py     # Model training pipeline
    /api/
      matching.py     # Matching endpoints
      transcription.py # Transcription endpoints
      analytics.py    # Analytics endpoints
    main.py
  /ml_models/        # Saved model files
  /training/         # Training scripts
  requirements.txt
```

**API Endpoints**:
```
POST   /ai/matching/recommend            - Get mentor recommendations
POST   /ai/matching/score                - Score a mentor-mentee pair
POST   /ai/transcription/start           - Start transcribing session
POST   /ai/transcription/stop            - Stop and get summary
POST   /ai/knowledge-graph/update        - Update knowledge graph
GET    /ai/knowledge-graph/:userId       - Get knowledge graph
POST   /ai/analytics/predict-churn       - Predict churn probability
POST   /ai/content/moderate              - Moderate content
```

**Matching Algorithm**:
```python
class MentorMatcher:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.index = faiss.IndexFlatL2(384)  # 384-dim embeddings

    async def recommend_mentors(
        self,
        mentee_id: str,
        limit: int = 10
    ) -> List[MatchRecommendation]:
        # 1. Get mentee profile and embedding
        mentee = await self.get_mentee_profile(mentee_id)
        mentee_embedding = self.generate_embedding(mentee)

        # 2. Get all mentor embeddings
        mentors = await self.get_active_mentors()
        mentor_embeddings = np.array([
            m.embedding for m in mentors
        ])

        # 3. Similarity search
        distances, indices = self.index.search(
            mentee_embedding.reshape(1, -1),
            k=limit * 3  # Get more for post-filtering
        )

        # 4. Apply business rules
        candidates = []
        for dist, idx in zip(distances[0], indices[0]):
            mentor = mentors[idx]

            # Filter by availability
            if not self.has_availability(mentor):
                continue

            # Filter by price range
            if mentor.hourlyRate > mentee.maxPrice:
                continue

            # Calculate compatibility score
            score = self.calculate_score(
                semantic_similarity=1 - (dist / 2),  # Normalize
                availability_match=self.availability_overlap(mentee, mentor),
                expertise_match=self.expertise_match(mentee, mentor),
                communication_style=self.style_match(mentee, mentor),
                past_success_rate=mentor.successRate
            )

            candidates.append(MatchRecommendation(
                mentor_id=mentor.id,
                score=score,
                factors=self.explain_score(mentee, mentor)
            ))

        # 5. Sort and return top N
        candidates.sort(key=lambda x: x.score, reverse=True)
        return candidates[:limit]

    def calculate_score(
        self,
        semantic_similarity: float,
        availability_match: float,
        expertise_match: float,
        communication_style: float,
        past_success_rate: float
    ) -> float:
        # Weighted scoring
        weights = {
            'semantic': 0.30,
            'availability': 0.20,
            'expertise': 0.25,
            'communication': 0.10,
            'success': 0.15
        }

        return (
            semantic_similarity * weights['semantic'] +
            availability_match * weights['availability'] +
            expertise_match * weights['expertise'] +
            communication_style * weights['communication'] +
            past_success_rate * weights['success']
        ) * 100  # Scale to 0-100
```

**Session Transcription**:
```python
class TranscriptionService:
    def __init__(self):
        self.deepgram = Deepgram(api_key=settings.DEEPGRAM_API_KEY)
        self.openai = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def transcribe_and_summarize(
        self,
        session_id: str,
        audio_url: str
    ) -> SessionTranscript:
        # 1. Transcribe audio
        transcript = await self.deepgram.transcribe(
            url=audio_url,
            options={
                'punctuate': True,
                'paragraphs': True,
                'utterances': True,
                'keywords': True,
                'sentiment': True
            }
        )

        # 2. Extract structure
        full_text = transcript['results']['channels'][0]['alternatives'][0]['transcript']
        paragraphs = transcript['results']['channels'][0]['alternatives'][0]['paragraphs']

        # 3. GPT-4 summarization
        summary = await self.openai.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at summarizing mentorship sessions. Extract key learnings, action items, and breakthroughs."
                },
                {
                    "role": "user",
                    "content": f"Summarize this mentorship session:\n\n{full_text}"
                }
            ],
            temperature=0.3
        )

        # 4. Extract action items
        action_items = await self.extract_action_items(full_text)

        # 5. Identify key moments
        key_moments = await self.identify_key_moments(
            paragraphs,
            transcript['results']['utterances']
        )

        # 6. Generate knowledge nodes
        knowledge_nodes = await self.extract_knowledge(full_text)

        return SessionTranscript(
            session_id=session_id,
            transcript=full_text,
            summary=summary.choices[0].message.content,
            action_items=action_items,
            key_moments=key_moments,
            knowledge_nodes=knowledge_nodes,
            sentiment=transcript['results']['sentiment']['average'],
            topics=transcript['results']['keywords']
        )
```

---

#### Video Service
**Responsibilities**:
- Create/manage video rooms
- WebRTC signaling
- Recording management
- Quality monitoring
- Fallback to external providers

**Tech Stack**:
- NestJS with Socket.io
- Agora SDK (primary provider)
- Twilio (fallback)
- S3 for recording storage
- CloudFront for delivery

**WebRTC Flow**:
```
1. User requests to join → POST /video/rooms/:id/token
2. Backend creates Agora token → Returns token + channel info
3. Frontend initializes Agora client → Joins channel
4. WebRTC peer connection established
5. If recording → Start cloud recording
6. On session end → Stop recording, upload to S3
7. Post-processing → Generate thumbnails, transcribe
```

**API Endpoints**:
```
POST   /video/rooms/create              - Create video room
GET    /video/rooms/:id/token           - Get access token
POST   /video/rooms/:id/recording/start - Start recording
POST   /video/rooms/:id/recording/stop  - Stop recording
GET    /video/rooms/:id/participants    - Get current participants
WS     /video/signaling                 - WebRTC signaling (fallback)
GET    /video/recordings/:id            - Get recording details
```

**Database Schema**:
```prisma
model VideoRoom {
  id              String   @id @default(uuid())
  bookingId       String   @unique
  provider        VideoProvider @default(AGORA)
  externalRoomId  String   // Agora channel ID
  status          VideoRoomStatus @default(SCHEDULED)

  // Recording
  recordingId     String?  @unique
  recordingUrl    String?  @db.Text
  recordingSize   BigInt?  // bytes
  transcriptUrl   String?  @db.Text
  thumbnailUrl    String?  @db.Text

  // Session data
  startedAt       DateTime?
  endedAt         DateTime?
  duration        Int?     // seconds
  participants    Json     // Join/leave events
  qualityMetrics  Json     // Network stats

  createdAt       DateTime @default(now())

  @@index([bookingId])
  @@index([status])
}

enum VideoProvider {
  AGORA
  TWILIO
  CUSTOM_WEBRTC
}

enum VideoRoomStatus {
  SCHEDULED
  WAITING
  ACTIVE
  COMPLETED
  FAILED
  CANCELLED
}

model VideoRecording {
  id              String   @id @default(uuid())
  roomId          String
  storageUrl      String   @db.Text // S3 URL
  duration        Int      // seconds
  fileSize        BigInt   // bytes
  format          String   // mp4, webm
  resolution      String   // 1280x720
  fps             Int      // 30
  processingStatus RecordingStatus @default(PENDING)

  // Post-processing
  thumbnails      String[] // Multiple thumbnail URLs
  transcriptId    String?  @unique

  createdAt       DateTime @default(now())
  processedAt     DateTime?

  room VideoRoom @relation(fields: [roomId], references: [id])

  @@index([roomId])
}

enum RecordingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

### 1.3 Inter-Service Communication

#### Communication Patterns

**Synchronous (REST/gRPC)**:
- Auth service validates tokens for other services
- Payment service called during booking creation
- User service queried for profile data

**Asynchronous (Message Queue)**:
- Booking created → Email notification queued
- Payment completed → Update analytics
- Session ended → Trigger transcription job

**Event-Driven (Event Bus)**:
- User events: created, updated, deleted
- Booking events: created, confirmed, completed, cancelled
- Payment events: succeeded, failed, refunded

**Message Queue Setup (BullMQ)**:
```typescript
// Producer (Booking Service)
await this.queue.add('booking.created', {
  bookingId: booking.id,
  mentorId: booking.mentorId,
  menteeId: booking.menteeId,
  startTime: booking.startTime,
});

// Consumer (Notification Service)
@Process('booking.created')
async handleBookingCreated(job: Job<BookingCreatedEvent>) {
  const { bookingId, mentorId, menteeId } = job.data;

  // Send email to mentor
  await this.emailService.send({
    to: mentor.email,
    template: 'booking-received',
    data: { booking }
  });

  // Send email to mentee
  await this.emailService.send({
    to: mentee.email,
    template: 'booking-confirmed',
    data: { booking }
  });

  // Send push notification
  await this.pushService.send(mentorId, {
    title: 'New Booking',
    body: `${mentee.name} booked a session with you`
  });
}
```

---

## 2. Database Schema Design

### 2.1 Complete v3.0 Schema

```prisma
// ============================================================================
// CORE USER & AUTH
// ============================================================================

model User {
  id               String    @id @default(uuid())
  email            String    @unique
  passwordHash     String
  firstName        String
  lastName         String?
  role             UserRole  @default(MENTEE)

  // Profile
  avatarUrl        String?   @db.Text
  bio              String?   @db.Text
  headline         String?
  videoIntroUrl    String?   @db.Text

  // Contact
  phone            String?
  timezone         String    @default("UTC")
  language         String    @default("en")

  // Mentor fields
  yearsExperience  Int?
  hourlyRate       Decimal?  @db.Decimal(10, 2)
  isPublic         Boolean   @default(false)
  isPremium        Boolean   @default(false)

  // Stats
  rating           Decimal?  @db.Decimal(3, 2)
  totalReviews     Int       @default(0)
  totalSessions    Int       @default(0)
  totalRevenue     Decimal   @default(0) @db.Decimal(10, 2)

  // Gamification
  points           Int       @default(0)
  level            Int       @default(1)
  currentStreak    Int       @default(0)
  longestStreak    Int       @default(0)

  // Payment
  stripeCustomerId String?   @unique
  stripeAccountId  String?   @unique

  // Security
  emailVerified    Boolean   @default(false)
  twoFactorEnabled Boolean   @default(false)
  twoFactorSecret  String?   @db.Text

  // v3.0 additions
  tenantId         String?
  learningStyle    String[]  // visual, auditory, kinesthetic
  communicationPref String?  // formal, casual, structured
  onboardingCompleted Boolean @default(false)
  lastActiveAt     DateTime?

  // Timestamps
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  deletedAt        DateTime? // Soft delete

  // Relations
  tenant           Tenant?   @relation(fields: [tenantId], references: [id])
  mentorProfile    MentorProfile?
  matchingProfile  MatchingProfile?
  categories       UserCategory[]
  // ... all other relations from v2.0

  // v3.0 new relations
  coursesCreated   Course[]  @relation("CourseCreator")
  coursesEnrolled  CourseEnrollment[]
  communities      CommunityMember[]
  forumPosts       ForumPost[]
  calendarConnections CalendarConnection[]
  integrations     UserIntegration[]
  twoFactorAuth    TwoFactorAuth?

  @@index([email])
  @@index([tenantId])
  @@index([role, isPublic])
  @@index([deletedAt])
}

// ============================================================================
// AI / ML MODELS
// ============================================================================

model MatchingProfile {
  id                    String   @id @default(uuid())
  userId                String   @unique

  // Profile embedding (384-dim sentence transformer)
  embedding             Float[]

  // Structured data for filtering
  skills                String[]
  industries            String[]
  jobTitles             String[]
  learningGoals         Json     // Structured taxonomy

  // Preferences
  communicationStyle    String?  // formal, casual, structured
  sessionFormat         String[] // video, chat, email
  availability          Json     // Preferred times
  priceRange            Json     // {min, max, currency}

  // Behavioral data
  avgSessionRating      Float?
  rebookingRate         Float?
  responseTime          Float?   // hours
  completionRate        Float?

  // Last updated
  updatedAt             DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model SessionTranscript {
  id              String   @id @default(uuid())
  bookingId       String   @unique
  videoRoomId     String?

  // Transcription
  transcript      String   @db.Text
  language        String   @default("en")
  confidence      Float?   // 0-1

  // AI-generated content
  summary         String   @db.Text
  actionItems     Json     // [{text, assignee, deadline}]
  insights        Json     // Key learnings
  topics          String[] // Auto-tagged topics
  keyMoments      Json     // [{timestamp, description, type}]

  // Sentiment
  overallSentiment Float   // -1 to 1
  sentimentBySegment Json  // Sentiment over time

  // Engagement metrics
  speakerTimes    Json     // Time each person spoke
  interruptionCount Int?
  silenceDuration Int?     // seconds

  createdAt       DateTime @default(now())

  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId])
}

model KnowledgeNode {
  id              String   @id @default(uuid())
  userId          String

  // Node data
  concept         String   // e.g., "React Hooks"
  description     String   @db.Text
  category        String?  // "programming", "business", etc.

  // Source
  sourceType      String   // booking, course, article
  sourceId        String   // ID of source

  // Connections
  relatedNodes    String[] // IDs of related concepts
  prerequisites   String[] // Required knowledge
  nextSteps       String[] // What to learn next

  // Mastery
  masteryLevel    Float    @default(0) // 0-1
  lastReviewed    DateTime?
  reviewCount     Int      @default(0)

  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, concept])
  @@index([category])
}

model UserHealthScore {
  id                  String   @id @default(uuid())
  userId              String

  // Overall score (0-100)
  score               Int

  // Risk factors
  churnProbability    Float    // 0-1
  engagementTrend     String   // increasing, stable, declining, critical

  // Contributing factors
  sessionFrequency    Float    // sessions per week
  lastSessionDays     Int      // days since last session
  messageResponseRate Float    // 0-1
  goalCompletionRate  Float    // 0-1

  // Recommendations
  recommendedActions  Json     // AI suggestions
  interventionPriority String  // low, medium, high, critical

  // Timestamps
  calculatedAt        DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, calculatedAt(sort: Desc)])
  @@index([churnProbability(sort: Desc)])
}

// ============================================================================
// MULTI-TENANCY
// ============================================================================

model Tenant {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique

  // Custom domain
  customDomain    String?  @unique

  // Branding
  logoUrl         String?  @db.Text
  primaryColor    String?  // #HEX
  secondaryColor  String?
  fontFamily      String?

  // Settings
  settings        Json     @default("{}")
  featureFlags    Json     @default("{}")

  // Plan
  plan            TenantPlan @default(STARTER)
  maxUsers        Int?
  maxStorage      BigInt?  // bytes

  // SSO
  ssoEnabled      Boolean  @default(false)
  ssoConfig       Json?    // SAML, OAuth config

  // Billing
  billingEmail    String?
  stripeCustomerId String? @unique

  // Status
  isActive        Boolean  @default(true)
  trialEndsAt     DateTime?

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  users           User[]
  analytics       TenantAnalytics[]

  @@index([slug])
  @@index([customDomain])
}

enum TenantPlan {
  STARTER       // $99/mo
  PROFESSIONAL  // $499/mo
  ENTERPRISE    // $2499/mo
  CUSTOM        // Negotiated
}

model TenantAnalytics {
  id              String   @id @default(uuid())
  tenantId        String
  date            DateTime @db.Date

  // Usage
  activeUsers     Int      @default(0)
  newSignups      Int      @default(0)
  totalSessions   Int      @default(0)
  totalRevenue    Decimal  @default(0) @db.Decimal(10, 2)

  // Engagement
  avgSessionsPerUser Float?
  avgSessionDuration Float? // minutes
  completionRate  Float?   // 0-1

  // Storage
  storageUsed     BigInt?  // bytes

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, date])
  @@index([date])
}

// ============================================================================
// COURSES & CONTENT
// ============================================================================

model Course {
  id              String   @id @default(uuid())
  creatorId       String
  tenantId        String?

  // Basic info
  title           String
  slug            String
  description     String   @db.Text
  thumbnail       String?  @db.Text
  trailerUrl      String?  @db.Text

  // Pricing
  price           Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")
  discountedPrice Decimal? @db.Decimal(10, 2)

  // Metadata
  level           CourseLevel
  duration        Int      // estimated minutes
  language        String   @default("en")
  tags            String[]

  // Stats
  enrollmentCount Int      @default(0)
  rating          Decimal? @db.Decimal(3, 2)
  reviewCount     Int      @default(0)

  // Status
  status          CourseStatus @default(DRAFT)
  publishedAt     DateTime?

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  creator         User     @relation("CourseCreator", fields: [creatorId], references: [id])
  tenant          Tenant?  @relation(fields: [tenantId], references: [id])
  modules         CourseModule[]
  enrollments     CourseEnrollment[]
  reviews         CourseReview[]

  @@unique([creatorId, slug])
  @@index([status, publishedAt])
  @@index([tenantId])
}

enum CourseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  ALL_LEVELS
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model CourseModule {
  id          String   @id @default(uuid())
  courseId    String
  title       String
  description String?  @db.Text
  sortOrder   Int

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons     Lesson[]

  @@index([courseId, sortOrder])
}

model Lesson {
  id          String   @id @default(uuid())
  moduleId    String

  // Basic info
  title       String
  description String?  @db.Text
  type        LessonType

  // Content (polymorphic based on type)
  content     Json     // Video URL, text content, quiz data, etc.

  // Metadata
  duration    Int?     // minutes
  sortOrder   Int
  isFree      Boolean  @default(false) // Allow preview

  // Resources
  attachments Json?    // [{name, url, size}]

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  module      CourseModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress    LessonProgress[]

  @@index([moduleId, sortOrder])
}

enum LessonType {
  VIDEO
  TEXT
  QUIZ
  ASSIGNMENT
  LIVE_SESSION
  DOWNLOAD
}

model CourseEnrollment {
  id              String   @id @default(uuid())
  userId          String
  courseId        String

  // Progress
  progress        Int      @default(0) // 0-100
  currentLessonId String?
  completed       Boolean  @default(false)

  // Certificate
  certificateId   String?  @unique
  certificateUrl  String?  @db.Text

  // Timestamps
  enrolledAt      DateTime @default(now())
  lastAccessedAt  DateTime @default(now())
  completedAt     DateTime?

  // Relations
  user            User     @relation(fields: [userId], references: [id])
  course          Course   @relation(fields: [courseId], references: [id])
  lessonProgress  LessonProgress[]

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

model LessonProgress {
  id            String   @id @default(uuid())
  enrollmentId  String
  lessonId      String

  // Progress
  completed     Boolean  @default(false)
  timeSpent     Int      @default(0) // seconds

  // Quiz/Assignment
  score         Float?   // 0-100
  attempts      Int      @default(0)
  submittedWork Json?

  // Timestamps
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  lastAccessedAt DateTime @default(now())

  // Relations
  enrollment    CourseEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  lesson        Lesson   @relation(fields: [lessonId], references: [id])

  @@unique([enrollmentId, lessonId])
  @@index([lessonId])
}

// ============================================================================
// COMMUNITIES & FORUMS
// ============================================================================

model Community {
  id              String   @id @default(uuid())
  tenantId        String?

  // Basic info
  name            String
  slug            String
  description     String   @db.Text
  avatarUrl       String?  @db.Text
  bannerUrl       String?  @db.Text

  // Settings
  isPrivate       Boolean  @default(false)
  requireApproval Boolean  @default(false)

  // Stats
  memberCount     Int      @default(0)
  postCount       Int      @default(0)

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  tenant          Tenant?  @relation(fields: [tenantId], references: [id])
  members         CommunityMember[]
  posts           ForumPost[]
  events          CommunityEvent[]

  @@unique([tenantId, slug])
  @@index([slug])
}

model CommunityMember {
  id          String   @id @default(uuid())
  communityId String
  userId      String
  role        CommunityRole @default(MEMBER)

  // Stats
  reputation  Int      @default(0)
  postCount   Int      @default(0)

  // Timestamps
  joinedAt    DateTime @default(now())

  // Relations
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([communityId, userId])
  @@index([userId])
}

enum CommunityRole {
  OWNER
  MODERATOR
  MEMBER
}

model ForumPost {
  id          String   @id @default(uuid())
  communityId String
  authorId    String

  // Content
  title       String
  content     String   @db.Text
  attachments Json?

  // Type
  type        PostType @default(DISCUSSION)

  // Engagement
  viewCount   Int      @default(0)
  likeCount   Int      @default(0)
  replyCount  Int      @default(0)

  // Status
  isPinned    Boolean  @default(false)
  isLocked    Boolean  @default(false)

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  author      User     @relation(fields: [authorId], references: [id])
  replies     ForumReply[]
  reactions   PostReaction[]

  @@index([communityId, createdAt(sort: Desc)])
  @@index([authorId])
}

enum PostType {
  DISCUSSION
  QUESTION
  ANNOUNCEMENT
  POLL
}

model ForumReply {
  id          String   @id @default(uuid())
  postId      String
  authorId    String
  parentId    String?  // For nested replies

  // Content
  content     String   @db.Text

  // Engagement
  likeCount   Int      @default(0)
  isAccepted  Boolean  @default(false) // For Q&A

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  post        ForumPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  author      User     @relation(fields: [authorId], references: [id])
  parent      ForumReply? @relation("ReplyThread", fields: [parentId], references: [id])
  replies     ForumReply[] @relation("ReplyThread")

  @@index([postId, createdAt(sort: Asc)])
  @@index([authorId])
}

// ============================================================================
// INTEGRATIONS
// ============================================================================

model Integration {
  id          String   @id @default(uuid())

  // Basic info
  name        String
  slug        String   @unique
  description String   @db.Text
  logoUrl     String?  @db.Text

  // Categorization
  category    IntegrationCategory
  provider    String   // google, microsoft, slack, etc.

  // Auth
  authType    AuthType
  authConfig  Json     // Provider-specific config

  // API
  apiEndpoint String?  @db.Text
  webhookUrl  String?  @db.Text

  // Status
  isActive    Boolean  @default(true)
  isBeta      Boolean  @default(false)

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  userIntegrations UserIntegration[]

  @@index([category])
  @@index([slug])
}

enum IntegrationCategory {
  CALENDAR
  VIDEO
  CRM
  COMMUNICATION
  PRODUCTIVITY
  ANALYTICS
  EMAIL
  STORAGE
  PAYMENT
}

enum AuthType {
  OAUTH2
  API_KEY
  BASIC
  CUSTOM
}

model UserIntegration {
  id            String   @id @default(uuid())
  userId        String
  integrationId String

  // Credentials (encrypted)
  accessToken   String?  @db.Text
  refreshToken  String?  @db.Text
  apiKey        String?  @db.Text

  // Config
  settings      Json     @default("{}")

  // Sync
  lastSyncAt    DateTime?
  syncStatus    SyncStatus @default(ACTIVE)
  errorMessage  String?  @db.Text

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  connectedAt   DateTime @default(now())

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  integration   Integration @relation(fields: [integrationId], references: [id])

  @@unique([userId, integrationId])
  @@index([userId])
}

enum SyncStatus {
  ACTIVE
  PAUSED
  ERROR
  EXPIRED
}

model CalendarConnection {
  id            String   @id @default(uuid())
  userId        String

  // Provider
  provider      CalendarProvider
  externalId    String   // External calendar ID
  accountEmail  String

  // Auth
  accessToken   String   @db.Text
  refreshToken  String?  @db.Text
  expiresAt     DateTime?

  // Settings
  syncEnabled   Boolean  @default(true)
  isDefault     Boolean  @default(false)

  // Sync
  lastSyncAt    DateTime?
  syncStatus    SyncStatus @default(ACTIVE)

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider, externalId])
  @@index([userId])
}

enum CalendarProvider {
  GOOGLE
  MICROSOFT
  APPLE
  CALDAV
}

// ============================================================================
// SECURITY
// ============================================================================

model TwoFactorAuth {
  id          String   @id @default(uuid())
  userId      String   @unique

  // TOTP
  method      TwoFactorMethod
  secret      String   @db.Text // Encrypted
  backupCodes String[] // Hashed

  // Recovery
  recoveryEmail String?
  recoveryPhone String?

  // Status
  isEnabled   Boolean  @default(true)
  verifiedAt  DateTime @default(now())

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

enum TwoFactorMethod {
  TOTP       // Google Authenticator
  SMS
  EMAIL
  BIOMETRIC
}

model SecurityEvent {
  id          String   @id @default(uuid())
  userId      String?
  tenantId    String?

  // Event
  eventType   SecurityEventType
  action      String
  resource    String?

  // Context
  ipAddress   String
  userAgent   String   @db.Text
  location    Json?    // {country, city, lat, lon}

  // Result
  success     Boolean
  errorMessage String? @db.Text

  // Severity
  severity    EventSeverity
  riskScore   Int?     // 0-100

  // Metadata
  metadata    Json?

  // Timestamp
  createdAt   DateTime @default(now())

  // Relations
  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId, createdAt(sort: Desc)])
  @@index([eventType, createdAt(sort: Desc)])
  @@index([severity, createdAt(sort: Desc)])
}

enum SecurityEventType {
  AUTH_LOGIN_SUCCESS
  AUTH_LOGIN_FAILED
  AUTH_LOGOUT
  AUTH_PASSWORD_RESET
  AUTH_2FA_ENABLED
  AUTH_2FA_DISABLED
  AUTH_TOKEN_REFRESH
  DATA_EXPORT
  DATA_DELETE
  PERMISSION_CHANGE
  SUSPICIOUS_ACTIVITY
  RATE_LIMIT_EXCEEDED
  API_KEY_CREATED
  API_KEY_REVOKED
}

enum EventSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

// ============================================================================
// ANALYTICS
// ============================================================================

model PlatformAnalytics {
  id              String   @id @default(uuid())
  date            DateTime @db.Date
  tenantId        String?  // null = global

  // Users
  totalUsers      Int      @default(0)
  activeUsers     Int      @default(0)
  newSignups      Int      @default(0)
  deletedUsers    Int      @default(0)

  // Sessions
  totalSessions   Int      @default(0)
  completedSessions Int    @default(0)
  cancelledSessions Int    @default(0)
  avgSessionDuration Float? // minutes

  // Revenue
  revenue         Decimal  @default(0) @db.Decimal(10, 2)
  refunds         Decimal  @default(0) @db.Decimal(10, 2)
  netRevenue      Decimal  @default(0) @db.Decimal(10, 2)

  // Engagement
  avgRating       Float?
  messagesCount   Int      @default(0)
  goalsCreated    Int      @default(0)
  goalsCompleted  Int      @default(0)

  // Churn
  churnedUsers    Int      @default(0)
  churnRate       Float?

  // Predictions (ML generated)
  predictions     Json?

  // Timestamp
  createdAt       DateTime @default(now())

  @@unique([date, tenantId])
  @@index([date])
  @@index([tenantId])
}
```

### 2.2 Migration Strategy

**Step 1**: Create new tables (no breaking changes)
```bash
# Run migrations for new tables
npx prisma migrate dev --name add-v3-tables
```

**Step 2**: Add new columns to existing tables
```bash
# Add tenantId to User, etc.
npx prisma migrate dev --name add-v3-columns
```

**Step 3**: Data migration
```typescript
// Backfill embeddings for existing users
async function migrateUserEmbeddings() {
  const users = await prisma.user.findMany({
    where: { matchingProfile: null }
  });

  for (const user of users) {
    const embedding = await aiService.generateEmbedding({
      bio: user.bio,
      headline: user.headline,
      // ... other fields
    });

    await prisma.matchingProfile.create({
      data: {
        userId: user.id,
        embedding,
        // ... other fields
      }
    });
  }
}
```

**Step 4**: Deploy services incrementally
```
1. Deploy AI service (new)
2. Deploy Video service (new)
3. Update Auth service
4. Update Booking service
5. Update web app
```

---

## 3. API Specifications

### 3.1 API Design Principles

1. **RESTful Design**: Resources as nouns, HTTP verbs for actions
2. **Consistent Naming**: snake_case for JSON, camelCase for TypeScript
3. **Versioning**: `/api/v3/` prefix
4. **Pagination**: Cursor-based for better performance
5. **Rate Limiting**: Per-user, per-IP, per-endpoint
6. **Error Handling**: Consistent error format

### 3.2 Standard Response Format

**Success Response**:
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-11-23T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email must be valid"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-11-23T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### 3.3 Pagination Format

**Cursor-based pagination** (preferred):
```json
{
  "data": [...],
  "pagination": {
    "has_next": true,
    "has_prev": false,
    "next_cursor": "eyJpZCI6IjEyMyJ9",
    "prev_cursor": null
  }
}
```

**Request**:
```
GET /api/v3/mentors?cursor=eyJpZCI6IjEyMyJ9&limit=20
```

### 3.4 Key v3.0 API Endpoints

#### AI Matching
```
POST   /api/v3/matching/recommend
  Body: {
    mentee_id: string,
    limit?: number,
    filters?: {
      categories?: string[],
      price_range?: {min: number, max: number},
      availability?: {...}
    }
  }
  Response: {
    recommendations: [{
      mentor_id: string,
      score: number, // 0-100
      factors: {
        semantic_match: number,
        availability_match: number,
        expertise_match: number,
        communication_match: number,
        success_rate: number
      },
      explanation: string
    }]
  }

POST   /api/v3/matching/feedback
  Body: {
    mentee_id: string,
    mentor_id: string,
    action: "viewed" | "booked" | "completed",
    rating?: number
  }
```

#### Video Rooms
```
POST   /api/v3/video/rooms
  Body: {
    booking_id: string
  }
  Response: {
    room_id: string,
    external_room_id: string,
    provider: "agora" | "twilio"
  }

GET    /api/v3/video/rooms/:id/token
  Query: {
    user_id: string,
    role: "host" | "participant"
  }
  Response: {
    token: string,
    expires_at: string,
    channel_name: string
  }

POST   /api/v3/video/rooms/:id/recording/start
POST   /api/v3/video/rooms/:id/recording/stop
```

#### Courses
```
GET    /api/v3/courses
  Query: {
    category?: string,
    level?: string,
    sort?: "popular" | "newest" | "rating",
    cursor?: string,
    limit?: number
  }

POST   /api/v3/courses
  Body: {
    title: string,
    description: string,
    price: number,
    level: "beginner" | "intermediate" | "advanced",
    modules: [{
      title: string,
      lessons: [{
        title: string,
        type: "video" | "text" | "quiz",
        content: {...}
      }]
    }]
  }

POST   /api/v3/courses/:id/enroll
POST   /api/v3/courses/:id/lessons/:lessonId/complete
```

#### Communities
```
GET    /api/v3/communities
POST   /api/v3/communities
POST   /api/v3/communities/:id/join
POST   /api/v3/communities/:id/posts
GET    /api/v3/communities/:id/posts
POST   /api/v3/communities/:id/events
```

---

## 4. AI/ML Implementation

(Already covered in Section 1.2 - AI Service)

Key algorithms:
- Sentence Transformers for embeddings
- FAISS for similarity search
- GPT-4 for summarization
- TensorFlow for prediction models

---

## 5. Video System Architecture

(Already covered in Section 1.2 - Video Service)

Key components:
- Agora SDK for WebRTC
- S3 for recording storage
- CloudFront for delivery
- Deepgram for transcription

---

## 6. Multi-Tenancy Design

### 6.1 Tenant Isolation Strategies

**Database-Level Isolation**:
```typescript
// Middleware to set tenant context
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant from subdomain
    const host = req.headers.host;
    const subdomain = host.split('.')[0];

    // Load tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: subdomain }
    });

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Tenant not found');
    }

    // Set in request context
    req['tenant'] = tenant;
    req['tenantId'] = tenant.id;

    next();
  }
}

// Global scope for all queries
@Injectable()
export class PrismaTenantService {
  constructor(private prisma: PrismaService) {
    // Add middleware to auto-add tenantId filter
    this.prisma.$use(async (params, next) => {
      const tenantId = getCurrentTenantId(); // From AsyncLocalStorage

      if (tenantId && TENANT_SCOPED_MODELS.includes(params.model)) {
        if (params.action === 'findMany' || params.action === 'findFirst') {
          params.args.where = {
            ...params.args.where,
            tenantId
          };
        }
      }

      return next(params);
    });
  }
}
```

### 6.2 Feature Flags per Tenant

```typescript
// Feature flag system
interface TenantFeatures {
  aiMatching: boolean;
  videoConferencing: boolean;
  courses: boolean;
  communities: boolean;
  whiteLabel: boolean;
  sso: boolean;
  customDomain: boolean;
  apiAccess: boolean;
}

const PLAN_FEATURES: Record<TenantPlan, TenantFeatures> = {
  STARTER: {
    aiMatching: true,
    videoConferencing: true,
    courses: false,
    communities: false,
    whiteLabel: false,
    sso: false,
    customDomain: false,
    apiAccess: false,
  },
  PROFESSIONAL: {
    aiMatching: true,
    videoConferencing: true,
    courses: true,
    communities: true,
    whiteLabel: true,
    sso: false,
    customDomain: false,
    apiAccess: true,
  },
  ENTERPRISE: {
    aiMatching: true,
    videoConferencing: true,
    courses: true,
    communities: true,
    whiteLabel: true,
    sso: true,
    customDomain: true,
    apiAccess: true,
  }
};

// Usage in code
@Get('courses')
@UseGuards(FeatureGuard('courses'))
async getCourses() {
  // Only accessible if tenant has courses feature
}
```

---

## 7. Mobile App Architecture

### 7.1 React Native Project Structure

```
/apps/mobile/
  /android/          # Android native code
  /ios/              # iOS native code
  /src/
    /screens/
      /Auth/
        LoginScreen.tsx
        RegisterScreen.tsx
      /Dashboard/
        DashboardScreen.tsx
      /Bookings/
        BookingsListScreen.tsx
        BookingDetailScreen.tsx
      /Messaging/
        ConversationsScreen.tsx
        ChatScreen.tsx
      /Video/
        VideoCallScreen.tsx
      /Profile/
        ProfileScreen.tsx
    /components/
      /ui/
        Button.tsx
        Input.tsx
        Card.tsx
      /shared/
        Header.tsx
        TabBar.tsx
    /navigation/
      AppNavigator.tsx
      AuthNavigator.tsx
      MainNavigator.tsx
    /services/
      api.ts
      socket.ts
      push-notifications.ts
    /store/
      auth.ts
      bookings.ts
      messages.ts
    /hooks/
      useAuth.ts
      useBookings.ts
      useMessages.ts
    /utils/
      date.ts
      formatting.ts
    /constants/
      colors.ts
      config.ts
  App.tsx
  index.js
```

### 7.2 Key Mobile Features

**Push Notifications**:
```typescript
// Setup FCM
import messaging from '@react-native-firebase/messaging';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const token = await messaging().getToken();
    await api.post('/users/me/push-token', { token });
  }
}

// Handle foreground notifications
messaging().onMessage(async (remoteMessage) => {
  showLocalNotification(remoteMessage);
});

// Handle background notifications
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background message:', remoteMessage);
});
```

**Biometric Authentication**:
```typescript
import * as LocalAuthentication from 'expo-local-authentication';

async function authenticateWithBiometrics() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access MentorHub',
    fallbackLabel: 'Use passcode',
  });

  return result.success;
}
```

**Offline Support**:
```typescript
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sync queue for offline actions
class OfflineQueue {
  async addAction(action) {
    const queue = await this.getQueue();
    queue.push(action);
    await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
  }

  async processQueue() {
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    if (!isConnected) return;

    const queue = await this.getQueue();
    for (const action of queue) {
      try {
        await api.request(action);
        await this.removeFromQueue(action.id);
      } catch (error) {
        console.error('Failed to process offline action:', error);
      }
    }
  }
}
```

---

## 8. Security & Compliance

### 8.1 Authentication Flow

```
1. User enters email/password
2. Backend validates credentials
3. Generate access token (15min) + refresh token (7 days)
4. Return both tokens
5. Frontend stores in secure storage
6. Include access token in Authorization header
7. On 401, use refresh token to get new access token
8. If refresh fails, redirect to login
```

### 8.2 Rate Limiting

```typescript
@ThrottlerGuard({
  limit: 100,    // requests
  ttl: 60,       // per 60 seconds
})
export class AppController {
  @ThrottlerGuard({
    limit: 5,
    ttl: 60,
  })
  @Post('auth/login')
  async login() {
    // More restrictive for auth endpoints
  }
}
```

### 8.3 GDPR Compliance

**Data Export**:
```typescript
@Get('users/me/export')
async exportUserData(@CurrentUser() user) {
  const data = {
    profile: await this.getUserProfile(user.id),
    bookings: await this.getBookings(user.id),
    messages: await this.getMessages(user.id),
    payments: await this.getPayments(user.id),
    // ... all user data
  };

  // Generate PDF
  const pdf = await this.pdfService.generate(data);

  // Send via email
  await this.emailService.send({
    to: user.email,
    subject: 'Your MentorHub Data Export',
    attachments: [{ filename: 'data-export.pdf', content: pdf }]
  });

  // Log for audit
  await this.auditLog.create({
    userId: user.id,
    action: 'DATA_EXPORT',
    ip: req.ip
  });
}
```

**Right to be Forgotten**:
```typescript
@Delete('users/me')
async deleteAccount(@CurrentUser() user) {
  // Soft delete user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      deletedAt: new Date(),
      email: `deleted_${user.id}@mentorhub.com`,
      passwordHash: 'DELETED',
      // Anonymize personal data
      firstName: 'Deleted',
      lastName: 'User',
      phone: null,
      bio: null,
    }
  });

  // Keep booking/payment records for compliance (anonymized)
  // Delete messages after 30 days
  // Delete uploaded files after 90 days

  await this.auditLog.create({
    userId: user.id,
    action: 'ACCOUNT_DELETED',
    ip: req.ip
  });
}
```

---

## 9. Performance Requirements

### 9.1 Target Metrics

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API Response (p95) | < 200ms | < 500ms |
| API Response (p99) | < 500ms | < 1000ms |
| Page Load (FCP) | < 1.5s | < 2.5s |
| Page Load (LCP) | < 2.5s | < 4.0s |
| Video Latency | < 100ms | < 200ms |
| Search Query | < 50ms | < 100ms |
| Database Query (p95) | < 50ms | < 100ms |
| Cache Hit Rate | > 80% | > 60% |
| API Uptime | 99.95% | 99.9% |
| Video Uptime | 99.9% | 99.5% |

### 9.2 Caching Strategy

**Multi-Layer Caching**:
```typescript
// L1: In-memory cache (Node.js)
import NodeCache from 'node-cache';
const memCache = new NodeCache({ stdTTL: 60 });

// L2: Redis cache
import Redis from 'ioredis';
const redis = new Redis();

// L3: Database query result cache
// Prisma automatically caches query results

// Cache hierarchy
async function getUser(userId: string): Promise<User> {
  // Check L1
  let user = memCache.get<User>(`user:${userId}`);
  if (user) return user;

  // Check L2
  const cached = await redis.get(`user:${userId}`);
  if (cached) {
    user = JSON.parse(cached);
    memCache.set(`user:${userId}`, user);
    return user;
  }

  // Query database (L3)
  user = await prisma.user.findUnique({ where: { id: userId } });

  // Populate caches
  await redis.setex(`user:${userId}`, 300, JSON.stringify(user));
  memCache.set(`user:${userId}`, user);

  return user;
}
```

**Cache Invalidation**:
```typescript
// Event-based invalidation
eventEmitter.on('user.updated', async (userId: string) => {
  memCache.del(`user:${userId}`);
  await redis.del(`user:${userId}`);
  await redis.del(`user:${userId}:*`); // Pattern delete
});

// Tag-based invalidation
class CacheService {
  async set(key: string, value: any, tags: string[]) {
    await redis.set(key, JSON.stringify(value));
    for (const tag of tags) {
      await redis.sadd(`tag:${tag}`, key);
    }
  }

  async invalidateByTag(tag: string) {
    const keys = await redis.smembers(`tag:${tag}`);
    if (keys.length > 0) {
      await redis.del(...keys);
      await redis.del(`tag:${tag}`);
    }
  }
}

// Usage
await cache.set('user:123', user, ['users', 'user:123']);
await cache.invalidateByTag('users'); // Invalidate all users
```

---

## 10. Deployment Strategy

### 10.1 Infrastructure

**Cloud Provider**: AWS (primary) + GCP (backup)

**Services**:
- **Compute**: EKS (Elastic Kubernetes Service)
- **Database**: RDS PostgreSQL (Multi-AZ)
- **Cache**: ElastiCache Redis (cluster mode)
- **Search**: Elasticsearch Service
- **Storage**: S3 + CloudFront CDN
- **Queue**: SQS + EventBridge
- **Monitoring**: CloudWatch + DataDog
- **Logging**: CloudWatch Logs + Elasticsearch

**Architecture**:
```
                 ┌──────────────┐
                 │ Route 53 DNS │
                 └──────┬───────┘
                        │
                 ┌──────▼────────┐
                 │  CloudFront   │
                 │     (CDN)     │
                 └──────┬────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
    ┌────▼────┐                 ┌──────▼──────┐
    │  ALB    │                 │     S3      │
    │(Public) │                 │  (Static)   │
    └────┬────┘                 └─────────────┘
         │
    ┌────▼────────────────┐
    │   EKS Cluster       │
    │  ┌──────────────┐   │
    │  │ Node Group 1 │   │
    │  │  (API Pods)  │   │
    │  └──────────────┘   │
    │  ┌──────────────┐   │
    │  │ Node Group 2 │   │
    │  │ (Worker Pods)│   │
    │  └──────────────┘   │
    └─────────┬───────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼──────┐      ┌──────▼────┐
│   RDS    │      │  Redis    │
│PostgreSQL│      │ Cluster   │
└──────────┘      └───────────┘
```

### 10.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            mentorhub/api:${{ github.sha }}
            mentorhub/api:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v2
      - run: |
          kubectl set image deployment/api \
            api=mentorhub/api:${{ github.sha }}
          kubectl rollout status deployment/api
```

### 10.3 Database Migrations

**Zero-Downtime Migrations**:
```bash
# Step 1: Add new column (nullable)
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);

# Step 2: Deploy code that writes to both old and new fields

# Step 3: Backfill data
UPDATE users SET new_field = old_field WHERE new_field IS NULL;

# Step 4: Deploy code that only uses new field

# Step 5: Make new column non-null
ALTER TABLE users ALTER COLUMN new_field SET NOT NULL;

# Step 6: Drop old column
ALTER TABLE users DROP COLUMN old_field;
```

### 10.4 Monitoring & Alerts

**DataDog Dashboards**:
- API performance (latency, throughput, errors)
- Database metrics (connections, query time, locks)
- Redis metrics (hit rate, memory, evictions)
- Business metrics (signups, bookings, revenue)

**Alerts**:
```yaml
# Alerts configuration
alerts:
  - name: High API Error Rate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    notify: [pagerduty, slack]

  - name: Database High CPU
    condition: cpu > 80%
    duration: 10m
    severity: warning
    notify: [slack]

  - name: Low Disk Space
    condition: disk_free < 20%
    duration: 5m
    severity: critical
    notify: [pagerduty]
```

---

## Appendix: Development Workflow

### Setup

```bash
# Clone repo
git clone https://github.com/mentorhub/mentorhub.git
cd mentorhub

# Install dependencies
npm install

# Setup environment
cp apps/api/.env.example apps/api/.env
# Edit .env with your credentials

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Seed database
npm run seed

# Start development
npm run dev
```

### Code Style

- **Linting**: ESLint + Prettier
- **Commit Convention**: Conventional Commits
- **Branch Strategy**: Git Flow
- **Code Review**: Required before merge

---

**Document End**

This specification provides a complete blueprint for implementing MentorHub v3.0. Each section can be expanded further as implementation progresses.

**Next Steps**:
1. Review and approve specifications
2. Create detailed sprint planning
3. Assign teams to each module
4. Begin Phase 1 implementation

**Version**: 1.0
**Last Updated**: 2025-11-23
