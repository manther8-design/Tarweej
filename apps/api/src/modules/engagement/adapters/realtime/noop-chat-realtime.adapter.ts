import { Injectable, Logger } from '@nestjs/common';
import type { ChatMessageEvent, ChatRealtimePort } from '../../domain/engagement.types';
import { CHAT_WEBSOCKET_PATH } from '../../domain/engagement.types';

/**
 * HTTP-first realtime stub. Replace with a Socket.IO / WS gateway that
 * listens on {@link CHAT_WEBSOCKET_PATH} without changing application services.
 */
@Injectable()
export class NoopChatRealtimeAdapter implements ChatRealtimePort {
  private readonly logger = new Logger(NoopChatRealtimeAdapter.name);

  async notifyNewMessage(event: ChatMessageEvent, participantIds: string[]): Promise<void> {
    this.logger.debug(
      `chat realtime stub (${CHAT_WEBSOCKET_PATH}): message ${event.messageId} → [${participantIds.join(', ')}]`,
    );
  }
}
