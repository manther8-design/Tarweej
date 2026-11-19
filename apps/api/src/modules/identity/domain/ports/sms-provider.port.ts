export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

export interface SendSmsCommand {
  toE164: string;
  body: string;
}

export interface SmsProviderPort {
  readonly name: string;
  send(command: SendSmsCommand): Promise<void>;
}
