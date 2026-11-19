/**
 * Engagement domain types (favorites + chat).
 * Chat transport is ported so HTTP can ship first and WebSocket can plug in later.
 */

export const CHAT_REALTIME_PORT = Symbol('CHAT_REALTIME_PORT');

/** Planned WebSocket path once a gateway is wired: `/api/v1/ws/chat`. */
export const CHAT_WEBSOCKET_PATH = '/api/v1/ws/chat';

export interface ChatMessageEvent {
  conversationId: string;
  messageId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface ChatRealtimePort {
  /**
   * Notify participants of a new message.
   * No-op under HTTP-only runtime; WebSocket gateway will fan-out here.
   */
  notifyNewMessage(event: ChatMessageEvent, participantIds: string[]): Promise<void>;
}

export const FAVORITEABLE_LISTING_STATUSES = ['active', 'paused', 'expired'] as const;

export type FavoriteAvailability = 'available' | 'expired' | 'unavailable' | 'deleted';
