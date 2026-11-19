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
import { RequirePermissions } from '../../../identity/adapters/http/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../identity/adapters/http/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../identity/adapters/http/guards/permissions.guard';
import type { AuthenticatedUser } from '../../../identity/domain/identity.types';
import { ListingsService } from '../../application/listings.service';
import { ListMyListingsQueryDto, ModerateListingDto } from './dto/listings.dto';

@ApiTags('admin-listings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/listings')
export class AdminListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get('pending')
  @RequirePermissions('listings.moderate')
  @ApiOperation({ summary: 'Listings pending moderation review' })
  listPending(@Query() query: ListMyListingsQueryDto) {
    return this.listings.listPending(query);
  }

  @Get(':id')
  @RequirePermissions('listings.read')
  @ApiOperation({ summary: 'Admin get listing detail' })
  adminGet(@Param('id', ParseUUIDPipe) id: string) {
    return this.listings.adminGet(id);
  }

  @Post(':id/approve')
  @RequirePermissions('listings.moderate')
  @ApiOperation({ summary: 'Approve pending listing (audited)' })
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ModerateListingDto,
  ) {
    return this.listings.approve(user.id, id, body.reason);
  }

  @Post(':id/reject')
  @RequirePermissions('listings.moderate')
  @ApiOperation({ summary: 'Reject pending listing (audited)' })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ModerateListingDto,
  ) {
    return this.listings.reject(user.id, id, body.reason);
  }
}
