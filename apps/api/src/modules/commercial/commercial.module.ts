import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { IdentityModule } from '../identity/identity.module';
import { AdminCommercialController } from './adapters/http/admin-commercial.controller';
import { PaymentsController } from './adapters/http/payments.controller';
import { PromotionsController } from './adapters/http/promotions.controller';
import { PaymentWebhooksController } from './adapters/http/webhooks.controller';
import { MockPaymentAdapter } from './adapters/payments/mock-payment.adapter';
import { PaymentRoutingService } from './application/payment-routing.service';
import { PaymentsService } from './application/payments.service';
import { PricingService } from './application/pricing.service';
import { PromotionsService } from './application/promotions.service';
import { PAYMENT_GATEWAY_REGISTRY } from './domain/commercial.types';

/**
 * Commercial bounded context (TRW-010).
 * Promotions: `/api/v1/promotions`
 * Payments: `/api/v1/payments`
 * Webhooks: `/api/v1/webhooks/payments/:providerCode`
 * Admin: `/api/v1/admin/commercial`
 */
@Module({
  imports: [PrismaModule, IdentityModule, ConfigurationModule],
  controllers: [
    PromotionsController,
    PaymentsController,
    PaymentWebhooksController,
    AdminCommercialController,
  ],
  providers: [
    MockPaymentAdapter,
    {
      provide: PAYMENT_GATEWAY_REGISTRY,
      useFactory: (mock: MockPaymentAdapter) => [mock],
      inject: [MockPaymentAdapter],
    },
    PaymentRoutingService,
    PricingService,
    PaymentsService,
    PromotionsService,
  ],
  exports: [PaymentsService, PromotionsService, PricingService, PaymentRoutingService],
})
export class CommercialModule {}
