import { Injectable, Scope } from '@nestjs/common';
import { Tenant } from '@prisma/client';

/**
 * Tenant Context Service
 *
 * Request-scoped service that holds the current tenant for the request lifecycle.
 * This ensures tenant isolation and prevents cross-tenant data leakage.
 *
 * Usage:
 *   constructor(private tenantContext: TenantContextService) {}
 *
 *   const tenant = this.tenantContext.getTenant();
 *   const tenantId = this.tenantContext.getTenantId();
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private tenant: Tenant | null = null;

  /**
   * Set the current tenant for this request
   */
  setTenant(tenant: Tenant): void {
    this.tenant = tenant;
  }

  /**
   * Get the current tenant
   * @throws Error if tenant is not set
   */
  getTenant(): Tenant {
    if (!this.tenant) {
      throw new Error('Tenant context not initialized. Did you forget to add TenantMiddleware?');
    }
    return this.tenant;
  }

  /**
   * Get the current tenant ID (convenience method)
   * @throws Error if tenant is not set
   */
  getTenantId(): string {
    return this.getTenant().id;
  }

  /**
   * Check if a tenant is currently set
   */
  hasTenant(): boolean {
    return this.tenant !== null;
  }

  /**
   * Get tenant or null (safe version)
   */
  getTenantOrNull(): Tenant | null {
    return this.tenant;
  }

  /**
   * Clear tenant context (for testing)
   */
  clear(): void {
    this.tenant = null;
  }
}
