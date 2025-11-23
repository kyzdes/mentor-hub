import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Tenant, TenantPlan, TenantStatus, Prisma } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

/**
 * Tenant Service
 *
 * Manages tenant lifecycle: creation, updates, billing, feature flags, analytics.
 * Core service for multi-tenancy infrastructure.
 */
@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new tenant
   */
  async create(data: CreateTenantDto): Promise<Tenant> {
    // Check if slug is already taken
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException(`Tenant with slug "${data.slug}" already exists`);
    }

    // Check if owner email is already used
    const existingByEmail = await this.prisma.tenant.findFirst({
      where: { ownerEmail: data.ownerEmail },
    });

    if (existingByEmail) {
      throw new ConflictException(`Tenant with owner email "${data.ownerEmail}" already exists`);
    }

    // Create tenant with default settings
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        plan: data.plan || TenantPlan.FREE,
        ownerEmail: data.ownerEmail,
        ownerName: data.ownerName,
        companySize: data.companySize,
        industry: data.industry,
        settings: {
          emailNotifications: true,
          allowPublicSignup: true,
          requireEmailVerification: true,
          allowGoogleAuth: true,
          timezone: 'UTC',
          language: 'en',
        },
        // Set trial period
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
      include: {
        domains: true,
        branding: true,
      },
    });

    // Create default branding
    await this.prisma.tenantBranding.create({
      data: {
        tenantId: tenant.id,
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
      },
    });

    // Create default domain
    await this.prisma.tenantDomain.create({
      data: {
        tenantId: tenant.id,
        domain: `${data.slug}.mentorhub.com`,
        isPrimary: true,
        isVerified: true,
        sslEnabled: true,
      },
    });

    // Create default feature flags
    await this.initializeFeatureFlags(tenant.id, data.plan || TenantPlan.FREE);

    return tenant;
  }

  /**
   * Find tenant by ID
   */
  async findById(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        domains: true,
        branding: true,
        featureFlags: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }

    return tenant;
  }

  /**
   * Find tenant by slug
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        domains: true,
        branding: true,
      },
    });
  }

  /**
   * Find tenant by domain
   */
  async findByDomain(domain: string): Promise<Tenant | null> {
    const tenantDomain = await this.prisma.tenantDomain.findUnique({
      where: { domain },
      include: {
        tenant: {
          include: {
            domains: true,
            branding: true,
          },
        },
      },
    });

    return tenantDomain?.tenant || null;
  }

  /**
   * Update tenant
   */
  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findById(id);

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== tenant.slug) {
      const existing = await this.prisma.tenant.findUnique({
        where: { slug: data.slug },
      });

      if (existing) {
        throw new ConflictException(`Tenant with slug "${data.slug}" already exists`);
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.plan && { plan: data.plan }),
        ...(data.status && { status: data.status }),
        ...(data.ownerEmail && { ownerEmail: data.ownerEmail }),
        ...(data.ownerName && { ownerName: data.ownerName }),
        ...(data.companySize && { companySize: data.companySize }),
        ...(data.industry && { industry: data.industry }),
        ...(data.settings && { settings: data.settings }),
      },
      include: {
        domains: true,
        branding: true,
      },
    });
  }

  /**
   * Upgrade tenant plan
   */
  async upgradePlan(id: string, plan: TenantPlan, stripeCustomerId?: string): Promise<Tenant> {
    const tenant = await this.findById(id);

    // Update plan limits based on tier
    const limits = this.getPlanLimits(plan);

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        plan,
        maxUsers: limits.maxUsers,
        maxMentors: limits.maxMentors,
        maxStorage: limits.maxStorage,
        ...(stripeCustomerId && { stripeCustomerId }),
        status: TenantStatus.ACTIVE,
      },
    });

    // Update feature flags for new plan
    await this.updateFeatureFlagsForPlan(id, plan);

    return updated;
  }

  /**
   * Suspend tenant (non-payment, violation, etc.)
   */
  async suspend(id: string, reason: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        status: TenantStatus.SUSPENDED,
        metadata: {
          suspensionReason: reason,
          suspendedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Reactivate suspended tenant
   */
  async reactivate(id: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        status: TenantStatus.ACTIVE,
      },
    });
  }

  /**
   * Delete tenant (hard delete)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.tenant.delete({
      where: { id },
    });
  }

  /**
   * Check if tenant has feature enabled
   */
  async hasFeature(tenantId: string, feature: string): Promise<boolean> {
    const featureFlag = await this.prisma.tenantFeatureFlag.findUnique({
      where: {
        tenantId_feature: {
          tenantId,
          feature,
        },
      },
    });

    return featureFlag?.enabled ?? false;
  }

  /**
   * Enable feature for tenant
   */
  async enableFeature(tenantId: string, feature: string, config?: any): Promise<void> {
    await this.prisma.tenantFeatureFlag.upsert({
      where: {
        tenantId_feature: {
          tenantId,
          feature,
        },
      },
      create: {
        tenantId,
        feature,
        enabled: true,
        config: config || {},
      },
      update: {
        enabled: true,
        ...(config && { config }),
      },
    });
  }

  /**
   * Disable feature for tenant
   */
  async disableFeature(tenantId: string, feature: string): Promise<void> {
    await this.prisma.tenantFeatureFlag.update({
      where: {
        tenantId_feature: {
          tenantId,
          feature,
        },
      },
      data: {
        enabled: false,
      },
    });
  }

  /**
   * Get tenant statistics
   */
  async getStats(tenantId: string) {
    const [
      userCount,
      mentorCount,
      activeUsers,
      totalSessions,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count({ where: { /* tenantId */ }}),
      this.prisma.user.count({ where: { /* tenantId, */ role: 'MENTOR' }}),
      this.prisma.user.count({
        where: {
          /* tenantId, */
          lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),
      this.prisma.booking.count({ where: { /* tenantId */ }}),
      this.prisma.payment.aggregate({
        where: { /* tenantId */ },
        _sum: { amount: true },
      }),
    ]);

    return {
      users: userCount,
      mentors: mentorCount,
      activeUsers,
      sessions: totalSessions,
      revenue: totalRevenue._sum.amount || 0,
    };
  }

  /**
   * Initialize default feature flags for a new tenant
   */
  private async initializeFeatureFlags(tenantId: string, plan: TenantPlan): Promise<void> {
    const features = this.getDefaultFeatures(plan);

    await this.prisma.tenantFeatureFlag.createMany({
      data: features.map(feature => ({
        tenantId,
        feature: feature.name,
        enabled: feature.enabled,
        config: feature.config || {},
      })),
    });
  }

  /**
   * Update feature flags when plan changes
   */
  private async updateFeatureFlagsForPlan(tenantId: string, plan: TenantPlan): Promise<void> {
    const features = this.getDefaultFeatures(plan);

    for (const feature of features) {
      await this.prisma.tenantFeatureFlag.upsert({
        where: {
          tenantId_feature: {
            tenantId,
            feature: feature.name,
          },
        },
        create: {
          tenantId,
          feature: feature.name,
          enabled: feature.enabled,
          config: feature.config || {},
        },
        update: {
          enabled: feature.enabled,
        },
      });
    }
  }

  /**
   * Get plan-specific limits
   */
  private getPlanLimits(plan: TenantPlan) {
    switch (plan) {
      case TenantPlan.FREE:
        return { maxUsers: 10, maxMentors: 5, maxStorage: 1024 * 1024 * 1024 }; // 1GB
      case TenantPlan.STARTER:
        return { maxUsers: 50, maxMentors: 25, maxStorage: 10 * 1024 * 1024 * 1024 }; // 10GB
      case TenantPlan.PROFESSIONAL:
        return { maxUsers: 200, maxMentors: 100, maxStorage: 50 * 1024 * 1024 * 1024 }; // 50GB
      case TenantPlan.ENTERPRISE:
        return { maxUsers: 10000, maxMentors: 5000, maxStorage: 500 * 1024 * 1024 * 1024 }; // 500GB
      default:
        return { maxUsers: 10, maxMentors: 5, maxStorage: 1024 * 1024 * 1024 };
    }
  }

  /**
   * Get default features by plan
   */
  private getDefaultFeatures(plan: TenantPlan) {
    const allFeatures = [
      { name: 'ai_matching', enabled: false },
      { name: 'video_conferencing', enabled: false },
      { name: 'courses', enabled: false },
      { name: 'communities', enabled: false },
      { name: 'custom_domain', enabled: false },
      { name: 'white_labeling', enabled: false },
      { name: 'sso', enabled: false },
      { name: 'api_access', enabled: false },
      { name: 'webhooks', enabled: false },
      { name: 'analytics', enabled: true },
      { name: 'email_notifications', enabled: true },
      { name: 'mobile_apps', enabled: true },
    ];

    // Enable features based on plan
    switch (plan) {
      case TenantPlan.FREE:
        return allFeatures; // Only analytics, email, mobile
      case TenantPlan.STARTER:
        return allFeatures.map(f =>
          ['ai_matching', 'video_conferencing', 'courses', 'analytics', 'email_notifications', 'mobile_apps'].includes(f.name)
            ? { ...f, enabled: true }
            : f
        );
      case TenantPlan.PROFESSIONAL:
        return allFeatures.map(f =>
          !['sso', 'white_labeling'].includes(f.name)
            ? { ...f, enabled: true }
            : f
        );
      case TenantPlan.ENTERPRISE:
        return allFeatures.map(f => ({ ...f, enabled: true })); // All features
      default:
        return allFeatures;
    }
  }
}
