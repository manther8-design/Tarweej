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
import { PaymentsService } from '../../application/payments.service';
import { ListPaymentsQueryDto, MockCompletePaymentDto } from './dto/commercial.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Payment history for current user' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListPaymentsQueryDto) {
    return this.payments.listForUser(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by id (owner only)' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.getForUser(user.id, id);
  }

  @Post(':id/mock-complete')
  @ApiOperation({
    summary:
      'Sandbox only: complete mock payment via signed webhook path (never trust client alone)',
  })
  mockComplete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: MockCompletePaymentDto,
  ) {
    return this.payments.mockComplete(user.id, id, body.outcome ?? 'paid');
  }
}
