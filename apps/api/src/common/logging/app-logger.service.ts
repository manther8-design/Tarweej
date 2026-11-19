import { ConsoleLogger, Injectable, type LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const LEVELS: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];

@Injectable()
export class AppLogger extends ConsoleLogger {
  constructor(config: ConfigService) {
    super('Tarweej');
    const configured = (config.get<string>('app.logLevel') ?? 'info').toLowerCase();
    const mapped: LogLevel = configured === 'info' ? 'log' : (configured as LogLevel) || 'log';
    const index = LEVELS.indexOf(mapped);
    this.setLogLevels(index >= 0 ? LEVELS.slice(0, index + 1) : ['error', 'warn', 'log']);
  }
}
