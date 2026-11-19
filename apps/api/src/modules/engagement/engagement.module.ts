import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { IdentityModule } from '../identity/identity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminReportsController } from './adapters/http/admin-reports.controller';
import { ConversationsController } from './adapters/http/conversations.controller';
import { FavoritesController } from './adapters/http/favorites.controller';
import { ReportsController } from './adapters/http/reports.controller';
import { NoopChatRealtimeAdapter } from './adapters/realtime/noop-chat-realtime.adapter';
import { ConversationsService } from './application/conversations.service';
import { FavoritesService } from './application/favorites.service';
import { ReportsService } from './application/reports.service';
import { CHAT_REALTIME_PORT } from './domain/engagement.types';

/**
 * Engagement bounded context (TRW-009 + TRW-011 reports).
 * Favorites: `/api/v1/favorites`
 * Chat: `/api/v1/conversations` (HTTP; WebSocket path stub `/api/v1/ws/chat`)
 * Reports: `/api/v1/reports`, `/api/v1/admin/reports`
 */
@Module({
  imports: [PrismaModule, IdentityModule, ConfigurationModule, NotificationsModule],
  controllers: [
    FavoritesController,
    ConversationsController,
    ReportsController,
    AdminReportsController,
  ],
  providers: [
    FavoritesService,
    ConversationsService,
    ReportsService,
    NoopChatRealtimeAdapter,
    { provide: CHAT_REALTIME_PORT, useExisting: NoopChatRealtimeAdapter },
  ],
  exports: [FavoritesService, ConversationsService, ReportsService],
})
export class EngagementModule {}
