import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Tenant } from '@prisma/client';

/**
 * Current Tenant Decorator
 *
 * Injects the current tenant into a controller method parameter.
 * Requires TenantMiddleware to be active.
 *
 * @example
 * @Get('settings')
 * getSettings(@CurrentTenant() tenant: Tenant) {
 *   return { name: tenant.name, plan: tenant.plan };
 * }
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Tenant | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant || null;
  },
);
