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
import { FavoritesService } from '../../application/favorites.service';
import { AddFavoriteDto, ListFavoritesQueryDto } from './dto/engagement.dto';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'List current user favorites' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListFavoritesQueryDto) {
    return this.favorites.list(user.id, query);
  }

  @Get('status/:listingId')
  @ApiOperation({ summary: 'Check whether a listing is favorited' })
  async status(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    const favorited = await this.favorites.isFavorited(user.id, listingId);
    return { listingId, favorited };
  }

  @Post()
  @ApiOperation({ summary: 'Add a listing to favorites' })
  add(@CurrentUser() user: AuthenticatedUser, @Body() body: AddFavoriteDto) {
    return this.favorites.add(user.id, body.listingId);
  }

  @Delete(':listingId')
  @ApiOperation({ summary: 'Remove a listing from favorites' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    return this.favorites.remove(user.id, listingId);
  }
}
