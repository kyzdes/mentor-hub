import { Module, Global, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TenantService } from './tenant.service';
import { TenantContextService } from './tenant-context.service';
import { TenantMiddleware } from './tenant.middleware';
import { TenantGuard } from './guards/tenant.guard';
import { TenantController } from './tenant.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Tenancy Module
 *
 * Provides multi-tenancy infrastructure for the entire application.
 * - Tenant resolution from subdomain/domain/header
 * - Tenant context management (request-scoped)
 * - Tenant guards and decorators
 * - Tenant CRUD operations
 * - REST API for tenant management
 *
 * This is a global module, so TenantService and TenantContextService
 * are available throughout the application without importing.
 */
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [TenantController],
  providers: [
    TenantService,
    TenantContextService,
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
  exports: [TenantService, TenantContextService],
})
export class TenancyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant middleware to all routes
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
