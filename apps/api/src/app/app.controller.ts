import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('platform')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Return basic platform information' })
  getPlatformInfo(): Record<string, string> {
    return {
      name: 'Tarweej Platform API',
      product: 'ترويج',
      status: 'operational',
      documentation: '/api/v1/docs',
    };
  }
}
