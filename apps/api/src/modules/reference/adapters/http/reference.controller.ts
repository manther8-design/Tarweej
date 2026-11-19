import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReferenceService } from '../../application/reference.service';

@ApiTags('reference')
@Controller('reference')
export class ReferenceController {
  constructor(private readonly reference: ReferenceService) {}

  @Get('countries')
  @ApiOperation({ summary: 'List active countries with associations' })
  @ApiQuery({ name: 'lang', required: false, description: 'Preferred language code for names' })
  @ApiOkResponse({ description: 'Active countries' })
  listCountries(@Query('lang') lang?: string) {
    return this.reference.listCountries(lang);
  }

  @Get('countries/:id')
  @ApiOperation({ summary: 'Get an active country by id' })
  @ApiQuery({ name: 'lang', required: false })
  getCountry(@Param('id', ParseUUIDPipe) id: string, @Query('lang') lang?: string) {
    return this.reference.getCountry(id, lang);
  }

  @Get('languages')
  @ApiOperation({ summary: 'List active languages' })
  listLanguages() {
    return this.reference.listLanguages();
  }

  @Get('languages/:id')
  @ApiOperation({ summary: 'Get an active language by id' })
  getLanguage(@Param('id', ParseUUIDPipe) id: string) {
    return this.reference.getLanguage(id);
  }

  @Get('currencies')
  @ApiOperation({ summary: 'List active currencies' })
  listCurrencies() {
    return this.reference.listCurrencies();
  }

  @Get('currencies/:id')
  @ApiOperation({ summary: 'Get an active currency by id' })
  getCurrency(@Param('id', ParseUUIDPipe) id: string) {
    return this.reference.getCurrency(id);
  }

  @Get('locales')
  @ApiOperation({ summary: 'List active locales' })
  listLocales() {
    return this.reference.listLocales();
  }

  @Get('regions')
  @ApiOperation({ summary: 'List active regions (optionally by country)' })
  @ApiQuery({ name: 'countryId', required: false })
  @ApiQuery({ name: 'lang', required: false })
  listRegions(@Query('countryId') countryId?: string, @Query('lang') lang?: string) {
    return this.reference.listRegions(countryId, lang);
  }

  @Get('regions/:id')
  @ApiOperation({ summary: 'Get an active region by id' })
  @ApiQuery({ name: 'lang', required: false })
  getRegion(@Param('id', ParseUUIDPipe) id: string, @Query('lang') lang?: string) {
    return this.reference.getRegion(id, lang);
  }

  @Get('cities')
  @ApiOperation({ summary: 'List active cities (filter by country or region)' })
  @ApiQuery({ name: 'countryId', required: false })
  @ApiQuery({ name: 'regionId', required: false })
  @ApiQuery({ name: 'lang', required: false })
  listCities(
    @Query('countryId') countryId?: string,
    @Query('regionId') regionId?: string,
    @Query('lang') lang?: string,
  ) {
    return this.reference.listCities({ countryId, regionId, languageCode: lang });
  }

  @Get('cities/:id')
  @ApiOperation({ summary: 'Get an active city by id' })
  @ApiQuery({ name: 'lang', required: false })
  getCity(@Param('id', ParseUUIDPipe) id: string, @Query('lang') lang?: string) {
    return this.reference.getCity(id, lang);
  }
}
