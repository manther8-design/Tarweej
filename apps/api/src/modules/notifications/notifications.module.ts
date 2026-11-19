import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { NotificationsController } from './adapters/http/notifications.controller';
import { FcmPushStubAdapter } from './adapters/push/fcm-push.stub.adapter';
import { NotificationsService } from './application/notifications.service';
import { PUSH_PROVIDER_PORT } from './domain/notifications.types';

/**
 * Notifications bounded context (TRW-011).
 * Inbox: `/api/v1/notifications`
 * Device tokens: `/api/v1/notifications/device-tokens`
 * Push: PushProviderPort → FCM stub (no production credentials).
 */
@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    FcmPushStubAdapter,
    { provide: PUSH_PROVIDER_PORT, useExisting: FcmPushStubAdapter },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
