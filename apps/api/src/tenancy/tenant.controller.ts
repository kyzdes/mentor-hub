import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentTenant } from './decorators/current-tenant.decorator';
import { Tenant, TenantPlan } from '@prisma/client';

/**
 * Tenant Controller
 *
 * Manages tenant lifecycle, settings, and features.
 * Most endpoints require ADMIN role for security.
 */
@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  /**
   * Create a new tenant (public endpoint for signup)
   */
  @Post()
  @ApiOperation({ summary: 'Create new tenant', description: 'Register a new organization/workspace' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 409, description: 'Slug or email already exists' })
  async create(@Body() dto: CreateTenantDto) {
    const tenant = await this.tenantService.create(dto);
    return {
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
        trialEndsAt: tenant.trialEndsAt,
      },
    };
  }

  /**
   * Get current tenant info
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current tenant', description: 'Get information about the current tenant context' })
  @ApiResponse({ status: 200, description: 'Tenant found' })
  @ApiResponse({ status: 404, description: 'No tenant context' })
  async getCurrentTenant(@CurrentTenant() tenant: Tenant) {
    if (!tenant) {
      return { success: false, message: 'No tenant context found' };
    }

    const stats = await this.tenantService.getStats(tenant.id);

    return {
      success: true,
      tenant: {
        ...tenant,
        stats,
      },
    };
  }

  /**
   * Get tenant by ID (admin only)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant by ID', description: 'Admin endpoint to fetch any tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Tenant found' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findById(@Param('id') id: string) {
    const tenant = await this.tenantService.findById(id);
    const stats = await this.tenantService.getStats(id);

    return {
      success: true,
      tenant: {
        ...tenant,
        stats,
      },
    };
  }

  /**
   * Update tenant
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant', description: 'Update tenant settings' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Tenant updated' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    const tenant = await this.tenantService.update(id, dto);

    return {
      success: true,
      tenant,
    };
  }

  /**
   * Upgrade tenant plan
   */
  @Post(':id/upgrade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade tenant plan', description: 'Change tenant subscription tier' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Plan upgraded' })
  async upgradePlan(
    @Param('id') id: string,
    @Body() body: { plan: TenantPlan; stripeCustomerId?: string },
  ) {
    const tenant = await this.tenantService.upgradePlan(id, body.plan, body.stripeCustomerId);

    return {
      success: true,
      tenant,
      message: `Plan upgraded to ${body.plan}`,
    };
  }

  /**
   * Suspend tenant
   */
  @Post(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend tenant', description: 'Suspend tenant account (violation, non-payment)' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @HttpCode(HttpStatus.OK)
  async suspend(@Param('id') id: string, @Body() body: { reason: string }) {
    const tenant = await this.tenantService.suspend(id, body.reason);

    return {
      success: true,
      tenant,
      message: 'Tenant suspended',
    };
  }

  /**
   * Reactivate tenant
   */
  @Post(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate tenant', description: 'Restore suspended tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @HttpCode(HttpStatus.OK)
  async reactivate(@Param('id') id: string) {
    const tenant = await this.tenantService.reactivate(id);

    return {
      success: true,
      tenant,
      message: 'Tenant reactivated',
    };
  }

  /**
   * Delete tenant
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete tenant',
    description: 'Permanently delete tenant and all associated data (DANGEROUS)',
  })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.tenantService.delete(id);

    return {
      success: true,
      message: 'Tenant deleted',
    };
  }

  /**
   * Get tenant feature flags
   */
  @Get(':id/features')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant features', description: 'List enabled features for tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  async getFeatures(@Param('id') id: string) {
    const tenant = await this.tenantService.findById(id);

    return {
      success: true,
      features: tenant.featureFlags,
    };
  }

  /**
   * Enable feature for tenant
   */
  @Post(':id/features/:feature/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable feature', description: 'Enable a specific feature for tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiParam({ name: 'feature', description: 'Feature name' })
  @HttpCode(HttpStatus.OK)
  async enableFeature(
    @Param('id') id: string,
    @Param('feature') feature: string,
    @Body() body: { config?: any },
  ) {
    await this.tenantService.enableFeature(id, feature, body.config);

    return {
      success: true,
      message: `Feature "${feature}" enabled`,
    };
  }

  /**
   * Disable feature for tenant
   */
  @Post(':id/features/:feature/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable feature', description: 'Disable a specific feature for tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiParam({ name: 'feature', description: 'Feature name' })
  @HttpCode(HttpStatus.OK)
  async disableFeature(@Param('id') id: string, @Param('feature') feature: string) {
    await this.tenantService.disableFeature(id, feature);

    return {
      success: true,
      message: `Feature "${feature}" disabled`,
    };
  }

  /**
   * Get tenant statistics
   */
  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant stats', description: 'Get usage statistics for tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  async getStats(@Param('id') id: string) {
    const stats = await this.tenantService.getStats(id);

    return {
      success: true,
      stats,
    };
  }
}
