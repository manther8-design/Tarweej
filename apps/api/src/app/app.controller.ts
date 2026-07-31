import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('platform')
@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Return basic platform information' })
  getPlatformInfo(): Record<string, string> {
    return {
      name: 'Tarweej Platform API',
      status: 'operational',
      documentation: '/docs',
    };
  }
}
