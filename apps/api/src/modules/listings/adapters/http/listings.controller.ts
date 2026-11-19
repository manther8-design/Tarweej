import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListingsService } from '../../application/listings.service';
import { ListPublicListingsQueryDto, RecordViewDto } from './dto/listings.dto';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'List public active listings' })
  @ApiOkResponse({ description: 'Paginated active listings' })
  listPublic(@Query() query: ListPublicListingsQueryDto) {
    return this.listings.listPublic(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a public active listing' })
  getPublic(@Param('id', ParseUUIDPipe) id: string) {
    return this.listings.getPublicActive(id);
  }

  @Post(':id/views')
  @ApiOperation({ summary: 'Increment listing view counter (public)' })
  recordView(@Param('id', ParseUUIDPipe) id: string, @Body() body: RecordViewDto) {
    return this.listings.recordView(id, { fingerprint: body.fingerprint });
  }
}
