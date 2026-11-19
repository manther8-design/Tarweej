/**
 * WebSocket gateway stub (TRW-009).
 *
 * Planned path: `/api/v1/ws/chat` (see CHAT_WEBSOCKET_PATH).
 *
 * When enabling realtime:
 * 1. Add `@nestjs/websockets` + `@nestjs/platform-socket.io` (or native `ws`).
 * 2. Implement `ChatGateway` with JWT auth on connection.
 * 3. Subscribe rooms by `conversationId` and/or `userId`.
 * 4. Provide `ChatRealtimePort` via the gateway (or an adapter that calls it)
 *    instead of `NoopChatRealtimeAdapter` in `EngagementModule`.
 *
 * Application services already call `CHAT_REALTIME_PORT.notifyNewMessage(...)`,
 * so HTTP send/list/read flows stay unchanged.
 */
export const CHAT_GATEWAY_STUB_NOTES = {
  path: '/api/v1/ws/chat',
  events: {
    clientToServer: ['join_conversation', 'leave_conversation', 'typing'],
    serverToClient: ['message.created', 'message.read'],
  },
  auth: 'Bearer access token via handshake query/header; only conversation participants may join rooms.',
} as const;
