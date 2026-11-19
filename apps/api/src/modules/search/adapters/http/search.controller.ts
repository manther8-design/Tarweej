import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from '../../application/search.service';
import { SearchListingsQueryDto } from './dto/search.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get('listings')
  @ApiOperation({
    summary: 'Search public listings',
    description:
      'Text search on title/description with category/city/country/price/featured filters, dynamic attribute filters (`attrs` JSON), sort, and pagination. Results may be Redis-cached.',
  })
  @ApiOkResponse({ description: 'Paginated search hits' })
  searchListings(@Query() query: SearchListingsQueryDto) {
    return this.search.searchListings({
      q: query.q,
      categoryId: query.categoryId,
      cityId: query.cityId,
      countryId: query.countryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      status: query.status ?? 'active',
      featured: query.featured,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
      attrsJson: query.attrs,
    });
  }
}
