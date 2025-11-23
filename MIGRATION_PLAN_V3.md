# MentorHub v3.0 - Database Migration Plan

**Version**: 3.0.0
**Date**: 2025-11-23
**Status**: Ready for Development

## Overview

This document outlines the database migration strategy from v2.0 to v3.0, adding 36 new models (1,278 lines) to support revolutionary features.

## Migration Statistics

- **v2.0 Schema**: 725 lines, 22 models
- **v3.0 Schema**: 2,003 lines, 58 models (+36 new)
- **New Tables**: 36
- **Modified Tables**: 2 (User, Booking)
- **New Enums**: 14
- **Estimated Migration Time**: 2-3 hours (zero-downtime)

## New Models by Category

### 1. Multi-Tenancy & White-Labeling (6 models)
- `Tenant` - Organization/tenant accounts
- `TenantDomain` - Custom domains per tenant
- `TenantBranding` - Visual customization
- `TenantAnalytics` - Per-tenant metrics
- `TenantFeatureFlag` - Feature toggles
- `TenantIntegration` - Tenant-level integrations

**Impact**: Foundation for B2B SaaS model, enables white-labeling

### 2. Course Management System (9 models)
- `Course` - Course catalog
- `CourseModule` - Course structure
- `Lesson` - Individual lessons (video, text, quiz, assignment)
- `Assignment` - Student assignments
- `Submission` - Assignment submissions
- `CourseEnrollment` - Student enrollments
- `LessonProgress` - Progress tracking
- `CourseReview` - Course ratings & reviews

**Impact**: Transforms platform from 1:1 mentoring to scalable education

### 3. Communities & Forums (7 models)
- `Community` - Learning communities
- `CommunityMember` - Membership records
- `ForumPost` - Discussion posts
- `ForumReply` - Threaded replies
- `PostReaction` - Emoji reactions
- `CommunityEvent` - Virtual events
- `EventAttendee` - Event registrations

**Impact**: Adds social learning, peer support, networking

### 4. AI/ML & Analytics (5 models)
- `MatchingProfile` - User embeddings for AI matching
- `SessionTranscript` - AI-generated transcripts
- `KnowledgeNode` - Knowledge graph from sessions
- `UserHealthScore` - Engagement health metrics
- `ChurnPrediction` - Predictive analytics

**Impact**: Intelligent matching, automated insights, retention

### 5. Video Conferencing (3 models)
- `VideoRoom` - Native video sessions
- `VideoParticipant` - Participant tracking
- `VideoRecording` - Session recordings

**Impact**: Independence from external video platforms

### 6. Integrations & Webhooks (6 models)
- `Integration` - Available integrations catalog
- `TenantIntegration` - Tenant-level connections
- `UserIntegration` - User-level OAuth connections
- `CalendarConnection` - Calendar sync (Google, Outlook)
- `WebhookEndpoint` - Outbound webhooks
- `WebhookLog` - Webhook delivery logs

**Impact**: Ecosystem connectivity, automation, extensibility

### 7. Security & Compliance (4 models)
- `TwoFactorAuth` - 2FA (TOTP, SMS, Email)
- `SecurityEvent` - Audit trail
- `DataExport` - GDPR data export requests
- `ConsentLog` - Privacy consent tracking

**Impact**: Enterprise-grade security, regulatory compliance

### 8. Platform Analytics (2 models)
- `PlatformAnalytics` - Daily platform metrics
- `FeatureUsage` - Feature adoption tracking

**Impact**: Data-driven product decisions, growth metrics

## Migration Strategy

### Phase 1: Pre-Migration (Day 1)
1. **Backup Production Database**
   ```bash
   pg_dump mentorhub > backup_v2_$(date +%Y%m%d).sql
   ```

2. **Create Migration Branch**
   ```bash
   git checkout -b migration/v3.0-schema
   ```

3. **Generate Prisma Migration**
   ```bash
   cd apps/api
   npx prisma migrate dev --name v3_comprehensive_schema
   ```

### Phase 2: Development Migration (Day 1-2)
1. **Run Migration on Development**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Seed Essential Data**
   ```typescript
   // Seed default integrations
   await prisma.integration.createMany({
     data: [
       { slug: 'google-calendar', provider: 'google', category: 'calendar' },
       { slug: 'zoom', provider: 'zoom', category: 'video' },
       { slug: 'slack', provider: 'slack', category: 'communication' },
       // ... more
     ]
   });

   // Seed default achievements for v3.0
   // Seed feature flags for all tenants
   ```

3. **Verify Data Integrity**
   ```bash
   npm run test:integration
   ```

### Phase 3: Staging Migration (Day 2-3)
1. **Deploy to Staging**
2. **Run Full E2E Tests**
3. **Performance Testing**
   - Query optimization
   - Index validation
   - Connection pool sizing

4. **Rollback Test**
   ```bash
   npx prisma migrate reset
   psql mentorhub < backup_v2_20251123.sql
   ```

### Phase 4: Production Migration (Day 3)
1. **Maintenance Window** (recommended: 2 AM UTC, Sunday)
2. **Enable Read-Only Mode**
3. **Final Backup**
4. **Run Migration**
   ```bash
   npx prisma migrate deploy
   ```
5. **Verify Health**
6. **Disable Read-Only**
7. **Monitor Metrics** (first 24 hours)

## Zero-Downtime Strategy

For production systems that cannot have downtime:

1. **Add New Tables** (no impact)
2. **Dual-Write** (old + new tables)
3. **Backfill Data** (async)
4. **Switch Reads** (gradual rollout)
5. **Remove Old Code**
6. **Drop Old Tables** (after 7 days)

## Data Backfill Requirements

### Immediate Backfill (Critical)
1. **MatchingProfile** - Generate embeddings for existing users
   ```typescript
   // Run AI service sync
   POST /api/v3/matching/load-mentors
   ```

2. **UserHealthScore** - Calculate initial health scores
   ```typescript
   // Background job: calculate for all active users
   ```

### Gradual Backfill (Non-Critical)
1. **SessionTranscript** - Retroactive transcription (if recordings exist)
2. **KnowledgeNode** - Extract from historical sessions
3. **PlatformAnalytics** - Historical metrics calculation

## Performance Considerations

### New Indexes Added
```sql
-- High-traffic queries
CREATE INDEX idx_matching_profiles_status ON matching_profiles(status);
CREATE INDEX idx_user_health_scores_user_date ON user_health_scores(user_id, date);
CREATE INDEX idx_video_rooms_status_scheduled ON video_rooms(status, scheduled_start);
CREATE INDEX idx_course_enrollments_user_status ON course_enrollments(user_id, status);
CREATE INDEX idx_forum_posts_community_created ON forum_posts(community_id, created_at DESC);
```

### Connection Pool Sizing
- **Current**: 10 connections
- **Recommended**: 20 connections (58 models vs 22)
- **Update**: `DATABASE_POOL_SIZE=20` in `.env`

### Caching Strategy
- **L1 (Memory)**: MatchingProfiles (5 min TTL)
- **L2 (Redis)**: Course catalog, Community metadata
- **L3 (DB)**: Everything else

## Breaking Changes

### API Changes
❌ **None** - v3.0 is additive, v2.0 API remains compatible

### Database Changes
✅ **Additive Only** - No columns removed, no types changed

### Migration Safety
- All foreign keys use `onDelete: Cascade` or `SetNull` (safe deletions)
- Optional relations use `?` (no required data)
- Default values provided for all new fields

## Rollback Plan

### Scenario 1: Migration Fails
```bash
# Automatic rollback via Prisma
npx prisma migrate resolve --rolled-back v3_comprehensive_schema
psql mentorhub < backup_v2_20251123.sql
```

### Scenario 2: Post-Migration Issues
```bash
# Revert code deployment
git revert HEAD
npm run deploy

# Database remains on v3.0 (additive, safe)
# v2.0 code ignores new tables
```

### Scenario 3: Critical Bug
```bash
# Emergency hotfix
git checkout v2.0
npm run deploy

# Schedule v3.0 retry
```

## Testing Checklist

### Pre-Migration
- [ ] Backup verified and restorable
- [ ] Migration runs successfully on dev
- [ ] No Prisma validation errors
- [ ] All foreign keys are valid
- [ ] Indexes are optimized

### Post-Migration
- [ ] All existing v2.0 features work
- [ ] User authentication works
- [ ] Bookings can be created
- [ ] Payments process correctly
- [ ] Messages send successfully
- [ ] No database connection errors
- [ ] Query performance acceptable (<100ms p95)
- [ ] No missing indexes warnings

### New Features (Smoke Test)
- [ ] Can create a course
- [ ] Can join a community
- [ ] AI matching returns results
- [ ] Video room creates successfully
- [ ] Integration connects (Google Calendar)
- [ ] 2FA can be enabled

## Monitoring

### Key Metrics (First 7 Days)
1. **Database**
   - Connection pool utilization
   - Query performance (p50, p95, p99)
   - Slow query log
   - Disk usage growth

2. **Application**
   - API latency
   - Error rate
   - Feature adoption (new v3.0 endpoints)
   - User churn

3. **Alerts**
   - Connection pool > 80%
   - Query time > 1s
   - Error rate > 1%
   - Disk usage > 80%

## Migration Timeline

| Day | Phase | Duration | Activities |
|-----|-------|----------|------------|
| 1 | Preparation | 2 hours | Backup, branch, migration file |
| 1-2 | Development | 8 hours | Deploy dev, seed data, test |
| 2-3 | Staging | 16 hours | Deploy staging, E2E tests, performance |
| 3 | Production | 2 hours | Maintenance window, migrate, verify |
| 3-10 | Monitoring | 7 days | Watch metrics, fix issues, iterate |

**Total Estimated Time**: 3 days (development) + 7 days (monitoring)

## Post-Migration Tasks

### Week 1
1. Monitor database performance
2. Optimize slow queries
3. Backfill critical data (MatchingProfile, UserHealthScore)
4. Enable v3.0 features gradually (feature flags)

### Week 2
1. Enable AI matching for all users
2. Launch course platform beta
3. Open community features
4. Enable integrations

### Month 1
1. Backfill historical data
2. Launch mobile apps (new video system)
3. Enable multi-tenancy (selected customers)
4. Performance optimization sprint

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Migration failure | Low | High | Automated rollback, tested in staging |
| Performance degradation | Medium | Medium | Connection pool increase, indexes |
| Data loss | Very Low | Critical | Multiple backups, point-in-time recovery |
| User downtime | Low | Medium | Zero-downtime strategy, maintenance window |
| Integration issues | Medium | Low | Gradual rollout, feature flags |

## Success Criteria

✅ Migration is successful if:
1. All v2.0 features work identically
2. No production errors for 24 hours
3. Query performance < 100ms p95
4. User churn < baseline
5. No database connection issues
6. All new models accessible via API

## Support Plan

### Team Responsibilities
- **Backend Lead**: Migration execution, rollback
- **DevOps**: Infrastructure, monitoring
- **QA**: Testing, validation
- **Product**: Feature enablement, user communication
- **Support**: User issues, bug triage

### Communication
- **Before**: Email to all users (24h notice)
- **During**: Status page updates every 30 min
- **After**: Success announcement, new features guide

## References

- [Prisma Migration Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [Zero-Downtime Migrations](https://stripe.com/blog/online-migrations)

---

**Prepared by**: AI Development Team
**Approved by**: [Pending]
**Last Updated**: 2025-11-23
