import { ConsoleLogger, Injectable, type LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getCorrelationId } from './request-context';

const LEVELS: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];

@Injectable()
export class AppLogger extends ConsoleLogger {
  private readonly jsonMode: boolean;

  constructor(config: ConfigService) {
    super('Tarweej');
    const configured = (config.get<string>('app.logLevel') ?? 'info').toLowerCase();
    const mapped: LogLevel = configured === 'info' ? 'log' : (configured as LogLevel) || 'log';
    const index = LEVELS.indexOf(mapped);
    this.setLogLevels(index >= 0 ? LEVELS.slice(0, index + 1) : ['error', 'warn', 'log']);

    const format = (config.get<string>('app.logFormat') ?? '').toLowerCase();
    const nodeEnv = (config.get<string>('app.nodeEnv') ?? 'development').toLowerCase();
    this.jsonMode = format === 'json' || (format !== 'pretty' && nodeEnv === 'production');
  }

  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestamp?: string,
  ): string {
    if (!this.jsonMode) {
      return super.formatMessage(
        logLevel,
        message,
        pidMessage,
        formattedLogLevel,
        contextMessage,
        timestamp ?? '',
      );
    }

    const payload = {
      level: logLevel === 'log' ? 'info' : logLevel,
      time: new Date().toISOString(),
      context: this.context,
      correlationId: getCorrelationId(),
      message: typeof message === 'string' ? message : JSON.stringify(message),
    };
    return `${JSON.stringify(payload)}\n`;
  }
}
