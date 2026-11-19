import {
  Body,
  Controller,
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
import { ConversationsService } from '../../application/conversations.service';
import {
  ListConversationsQueryDto,
  ListMessagesQueryDto,
  OpenConversationDto,
  SendMessageDto,
} from './dto/engagement.dto';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'List conversations for the current user' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListConversationsQueryDto) {
    return this.conversations.list(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Open or get a listing-scoped conversation (as buyer)' })
  open(@CurrentUser() user: AuthenticatedUser, @Body() body: OpenConversationDto) {
    return this.conversations.openOrGet(user.id, body.listingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation (participants only)' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.conversations.get(user.id, id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List messages in a conversation' })
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.conversations.listMessages(user.id, id, query);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SendMessageDto,
  ) {
    return this.conversations.sendMessage(user.id, id, body.body);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark messages from the other party as read' })
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.conversations.markRead(user.id, id);
  }
}
