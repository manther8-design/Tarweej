import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../../identity/adapters/http/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../identity/adapters/http/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../identity/domain/identity.types';
import { ListingsService } from '../../application/listings.service';
import { CreateListingDto, ListMyListingsQueryDto, UpdateListingDto } from './dto/listings.dto';

@ApiTags('my-listings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('my/listings')
export class MyListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'List current user listings' })
  listMine(@CurrentUser() user: AuthenticatedUser, @Query() query: ListMyListingsQueryDto) {
    return this.listings.listMine(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get own listing detail' })
  getMine(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.listings.getMine(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a draft listing' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateListingDto) {
    return this.listings.create(user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update own draft/rejected listing' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateListingDto,
  ) {
    return this.listings.update(user.id, id, body);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit listing for moderation review' })
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.listings.submitForReview(user.id, id);
  }

  @Post(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw pending listing back to draft' })
  withdraw(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.listings.withdraw(user.id, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause an active listing' })
  pause(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.listings.pause(user.id, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused listing' })
  resume(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.listings.resume(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete own listing' })
  softDelete(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.listings.softDelete(user.id, id);
  }

  @Post(':id/media')
  @ApiOperation({ summary: 'Upload listing media to object storage (metadata only in DB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        sortOrder: { type: 'integer' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  uploadMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile()
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    @Body('sortOrder') sortOrder?: string,
  ) {
    return this.listings.uploadMedia(
      user.id,
      id,
      file,
      sortOrder !== undefined ? Number(sortOrder) : undefined,
    );
  }

  @Delete(':id/media/:mediaId')
  @ApiOperation({ summary: 'Delete listing media' })
  deleteMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ) {
    return this.listings.deleteMedia(user.id, id, mediaId);
  }
}
