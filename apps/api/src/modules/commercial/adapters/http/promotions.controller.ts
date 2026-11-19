import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../identity/adapters/http/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../identity/adapters/http/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../identity/domain/identity.types';
import { PromotionsService } from '../../application/promotions.service';
import { ListPlansQueryDto, PurchasePromotionDto } from './dto/commercial.dto';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List active featured promotion pricing plans' })
  listPlans(@Query() query: ListPlansQueryDto) {
    return this.promotions.listPlans(query.countryId);
  }

  @Post('purchase')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Purchase featured promotion for own listing (creates Pending→Processing payment)',
  })
  purchase(@CurrentUser() user: AuthenticatedUser, @Body() body: PurchasePromotionDto) {
    return this.promotions.purchase(user.id, body);
  }
}
