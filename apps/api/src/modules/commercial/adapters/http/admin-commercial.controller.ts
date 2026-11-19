import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../identity/adapters/http/decorators/current-user.decorator';
import { RequirePermissions } from '../../../identity/adapters/http/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../identity/adapters/http/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../identity/adapters/http/guards/permissions.guard';
import type { AuthenticatedUser } from '../../../identity/domain/identity.types';
import { PaymentRoutingService } from '../../application/payment-routing.service';
import { PricingService } from '../../application/pricing.service';
import { PromotionsService } from '../../application/promotions.service';
import { UpsertPaymentRouteDto, UpsertPricingRuleDto } from './dto/commercial.dto';

@ApiTags('admin-commercial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/commercial')
export class AdminCommercialController {
  constructor(
    private readonly pricing: PricingService,
    private readonly routing: PaymentRoutingService,
    private readonly promotions: PromotionsService,
  ) {}

  @Get('pricing-rules')
  @RequirePermissions('payments.pricing.read')
  @ApiOperation({ summary: 'Admin list featured pricing rules' })
  listPricing() {
    return this.pricing.listAdmin();
  }

  @Put('pricing-rules')
  @RequirePermissions('payments.pricing.write')
  @ApiOperation({ summary: 'Create or update a featured pricing rule (audited)' })
  upsertPricing(@CurrentUser() user: AuthenticatedUser, @Body() body: UpsertPricingRuleDto) {
    return this.pricing.upsertAdmin(user.id, {
      id: body.id,
      countryId: body.countryId,
      currencyCode: body.currencyCode,
      placement: body.placement,
      pricePerHour: body.pricePerHour,
      maxSlots: body.maxSlots,
      defaultDurationHours: body.defaultDurationHours,
      minDurationHours: body.minDurationHours ?? 1,
      maxDurationHours: body.maxDurationHours ?? 168,
      rankWeight: body.rankWeight ?? 100,
      isActive: body.isActive ?? true,
    });
  }

  @Get('payment-routes')
  @RequirePermissions('payments.routes.read')
  @ApiOperation({ summary: 'Admin list country → provider payment routes' })
  listRoutes() {
    return this.routing.listRoutes();
  }

  @Put('payment-routes')
  @RequirePermissions('payments.routes.write')
  @ApiOperation({ summary: 'Upsert country payment provider route (audited via settings ops)' })
  upsertRoute(@Body() body: UpsertPaymentRouteDto) {
    return this.routing.upsertRoute({
      countryId: body.countryId,
      providerCode: body.providerCode,
      priority: body.priority,
      isActive: body.isActive ?? true,
    });
  }

  @Post('promotions/expire-due')
  @RequirePermissions('payments.pricing.write')
  @ApiOperation({ summary: 'Run featured promotion expiry job (idempotent)' })
  expireDue() {
    return this.promotions.expireDuePromotions();
  }
}
