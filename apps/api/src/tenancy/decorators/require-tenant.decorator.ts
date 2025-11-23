import { SetMetadata } from '@nestjs/common';
import { REQUIRE_TENANT_KEY } from '../guards/tenant.guard';

/**
 * Require Tenant Decorator
 *
 * Marks a controller or route as requiring tenant context.
 * Use with TenantGuard to enforce tenant isolation.
 *
 * @example
 * // On controller (applies to all routes)
 * @RequireTenant()
 * @Controller('courses')
 * export class CoursesController { ... }
 *
 * @example
 * // On specific route
 * @Get('premium-feature')
 * @RequireTenant()
 * getPremiumFeature() { ... }
 */
export const RequireTenant = () => SetMetadata(REQUIRE_TENANT_KEY, true);
