import { Injectable, Logger } from '@nestjs/common';
import type { SendSmsCommand, SmsProviderPort } from '../../domain/ports/sms-provider.port';

/**
 * Dev/mock SMS adapter. Logs OTP messages instead of calling a vendor.
 * Swap via DI when a real SMS/WhatsApp provider is configured.
 */
@Injectable()
export class MockSmsAdapter implements SmsProviderPort {
  readonly name = 'mock';
  private readonly logger = new Logger(MockSmsAdapter.name);
  readonly sent: SendSmsCommand[] = [];

  async send(command: SendSmsCommand): Promise<void> {
    this.sent.push(command);
    this.logger.log(`[mock-sms] to=${command.toE164} body=${command.body}`);
  }
}
