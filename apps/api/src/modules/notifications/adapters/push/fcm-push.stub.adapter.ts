import { Injectable, Logger } from '@nestjs/common';
import type { PushProviderPort } from '../../domain/notifications.types';

/**
 * FCM push adapter stub (TRW-011).
 * No production credentials; logs and accepts tokens so domain hooks stay wired.
 * Replace with a real FCM HTTP v1 client when credentials are configured.
 */
@Injectable()
export class FcmPushStubAdapter implements PushProviderPort {
  private readonly logger = new Logger(FcmPushStubAdapter.name);

  async send(input: {
    tokens: string[];
    message: { title: string; body: string; data?: Record<string, string> };
  }): Promise<{ accepted: number; rejected: number }> {
    if (input.tokens.length === 0) {
      return { accepted: 0, rejected: 0 };
    }
    this.logger.debug(`FCM stub send title="${input.message.title}" tokens=${input.tokens.length}`);
    return { accepted: input.tokens.length, rejected: 0 };
  }
}
