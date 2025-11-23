import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import { TenantContextService } from './tenant-context.service';

/**
 * Tenant Middleware
 *
 * Extracts tenant information from the request and sets it in the tenant context.
 * Supports multiple tenant resolution strategies:
 *
 * 1. Subdomain: app.acme-corp.mentorhub.com -> acme-corp
 * 2. Custom Domain: app.acme.com -> lookup domain in database
 * 3. Header: X-Tenant-ID or X-Tenant-Slug
 * 4. Query Param: ?tenant=acme-corp (for development)
 *
 * Priority: Header > Custom Domain > Subdomain > Query Param
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private tenantService: TenantService,
    private tenantContext: TenantContextService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const tenant = await this.resolveTenant(req);

      if (tenant) {
        // Check if tenant is active
        if (tenant.status === 'SUSPENDED') {
          throw new BadRequestException('This tenant account has been suspended. Please contact support.');
        }

        if (tenant.status === 'CANCELLED') {
          throw new BadRequestException('This tenant account has been cancelled.');
        }

        // Check trial expiration
        if (tenant.plan === 'FREE' && tenant.trialEndsAt && tenant.trialEndsAt < new Date()) {
          throw new BadRequestException('Trial period has expired. Please upgrade your plan.');
        }

        // Set tenant in context
        this.tenantContext.setTenant(tenant);

        // Add tenant to request for convenience
        (req as any).tenant = tenant;
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  private async resolveTenant(req: Request) {
    // Strategy 1: Check X-Tenant-ID header (admin override)
    const tenantIdHeader = req.headers['x-tenant-id'] as string;
    if (tenantIdHeader) {
      return this.tenantService.findById(tenantIdHeader);
    }

    // Strategy 2: Check X-Tenant-Slug header
    const tenantSlugHeader = req.headers['x-tenant-slug'] as string;
    if (tenantSlugHeader) {
      return this.tenantService.findBySlug(tenantSlugHeader);
    }

    // Strategy 3: Check custom domain
    const host = req.headers.host || '';
    const customDomain = host.split(':')[0]; // Remove port if present

    // Skip if it's the main domain
    if (!customDomain.includes('mentorhub.com')) {
      const tenant = await this.tenantService.findByDomain(customDomain);
      if (tenant) {
        return tenant;
      }
    }

    // Strategy 4: Check subdomain (app.acme-corp.mentorhub.com)
    const subdomain = this.extractSubdomain(host);
    if (subdomain && subdomain !== 'app' && subdomain !== 'www' && subdomain !== 'api') {
      return this.tenantService.findBySlug(subdomain);
    }

    // Strategy 5: Check query parameter (development only)
    const tenantQuery = req.query.tenant as string;
    if (tenantQuery && process.env.NODE_ENV === 'development') {
      return this.tenantService.findBySlug(tenantQuery);
    }

    // No tenant found - this is OK for public routes
    return null;
  }

  private extractSubdomain(host: string): string | null {
    const parts = host.split(':')[0].split('.');

    // app.acme-corp.mentorhub.com -> ['app', 'acme-corp', 'mentorhub', 'com']
    if (parts.length >= 3) {
      // Extract the tenant subdomain (second part)
      // app.acme-corp.mentorhub.com -> acme-corp
      if (parts[0] === 'app' && parts.length >= 4) {
        return parts[1];
      }
    }

    return null;
  }
}
