import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContextService } from '../tenant-context.service';

export const REQUIRE_TENANT_KEY = 'require_tenant';

/**
 * Tenant Guard
 *
 * Ensures that a tenant is present in the request context.
 * Use @RequireTenant() decorator on controllers or routes that need tenant isolation.
 *
 * Usage:
 *   @RequireTenant()
 *   @Get('dashboard')
 *   getDashboard() { ... }
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantContext: TenantContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if @RequireTenant() decorator is present
    const requireTenant = this.reflector.getAllAndOverride<boolean>(REQUIRE_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If decorator not present, allow access
    if (!requireTenant) {
      return true;
    }

    // Check if tenant is set
    if (!this.tenantContext.hasTenant()) {
      throw new ForbiddenException('This endpoint requires a valid tenant context');
    }

    return true;
  }
}
