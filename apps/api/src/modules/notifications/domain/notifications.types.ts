/**
 * Notifications domain (TRW-011).
 * In-app rows are persisted SoT; push is best-effort via PushProviderPort.
 */

export const PUSH_PROVIDER_PORT = Symbol('PUSH_PROVIDER_PORT');

export const NOTIFICATION_CHANNELS = ['in_app', 'push'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_TEMPLATE_CODES = [
  'listing.approved',
  'listing.rejected',
  'payment.success',
  'payment.failed',
  'featured.expired',
  'message.new',
] as const;
export type NotificationTemplateCode = (typeof NOTIFICATION_TEMPLATE_CODES)[number];

export const DEVICE_PLATFORMS = ['android', 'ios', 'web'] as const;
export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export interface PushProviderPort {
  /**
   * Deliver a push notification to the given device tokens.
   * Stub adapters no-op or log; production FCM will plug in here.
   */
  send(input: {
    tokens: string[];
    message: PushMessage;
  }): Promise<{ accepted: number; rejected: number }>;
}

export type CreateNotificationInput = {
  userId: string;
  templateCode: NotificationTemplateCode | string;
  payload?: Record<string, unknown>;
  /** Persist channel (default in_app). Push is attempted separately when tokens exist. */
  channel?: NotificationChannel;
  title?: string;
  body?: string;
};
