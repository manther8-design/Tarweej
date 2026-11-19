import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../identity/adapters/http/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../identity/adapters/http/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../identity/domain/identity.types';
import { NotificationsService } from '../../application/notifications.service';
import {
  ListNotificationsQueryDto,
  RegisterDeviceTokenDto,
  UnregisterDeviceTokenDto,
} from './dto/notifications.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List in-app notifications for the current user' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListNotificationsQueryDto) {
    return this.notifications.list(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count' })
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Post('device-tokens')
  @ApiOperation({ summary: 'Register or refresh an FCM/device push token' })
  registerDevice(@CurrentUser() user: AuthenticatedUser, @Body() body: RegisterDeviceTokenDto) {
    return this.notifications.registerDeviceToken(user.id, body);
  }

  @Delete('device-tokens')
  @ApiOperation({ summary: 'Unregister a device push token' })
  unregisterDevice(@CurrentUser() user: AuthenticatedUser, @Body() body: UnregisterDeviceTokenDto) {
    return this.notifications.unregisterDeviceToken(user.id, body.token);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markRead(user.id, id);
  }
}
