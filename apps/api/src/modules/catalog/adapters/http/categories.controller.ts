import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CatalogService } from '../../application/catalog.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List active category hierarchy (public)' })
  @ApiQuery({ name: 'lang', required: false, description: 'Preferred language code (ar, en)' })
  @ApiQuery({
    name: 'listingType',
    required: false,
    description: 'Filter by listing vertical (e.g. marketplace)',
  })
  @ApiOkResponse({ description: 'Category tree roots with nested children' })
  listTree(@Query('lang') lang?: string, @Query('listingType') listingType?: string) {
    return this.catalog.listCategoryTree({ lang, listingType });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an active category with its attributes' })
  @ApiQuery({ name: 'lang', required: false })
  getCategory(@Param('id', ParseUUIDPipe) id: string, @Query('lang') lang?: string) {
    return this.catalog.getCategory(id, lang);
  }

  @Get(':id/attributes')
  @ApiOperation({ summary: 'List dynamic attributes for an active category' })
  @ApiQuery({ name: 'lang', required: false })
  listAttributes(@Param('id', ParseUUIDPipe) id: string, @Query('lang') lang?: string) {
    return this.catalog.getCategory(id, lang).then((c) => c.attributes);
  }
}
