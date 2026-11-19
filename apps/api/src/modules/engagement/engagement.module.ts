import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { ConversationsController } from './adapters/http/conversations.controller';
import { FavoritesController } from './adapters/http/favorites.controller';
import { NoopChatRealtimeAdapter } from './adapters/realtime/noop-chat-realtime.adapter';
import { ConversationsService } from './application/conversations.service';
import { FavoritesService } from './application/favorites.service';
import { CHAT_REALTIME_PORT } from './domain/engagement.types';

/**
 * Engagement bounded context (TRW-009).
 * Favorites: `/api/v1/favorites`
 * Chat: `/api/v1/conversations` (HTTP; WebSocket path stub `/api/v1/ws/chat`)
 */
@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [FavoritesController, ConversationsController],
  providers: [
    FavoritesService,
    ConversationsService,
    NoopChatRealtimeAdapter,
    { provide: CHAT_REALTIME_PORT, useExisting: NoopChatRealtimeAdapter },
  ],
  exports: [FavoritesService, ConversationsService],
})
export class EngagementModule {}
