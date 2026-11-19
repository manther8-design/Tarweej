import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../identity/adapters/http/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../identity/adapters/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/adapters/http/guards/roles.guard';
import { ReferenceService } from '../../application/reference.service';
import {
  CreateCityDto,
  CreateCountryDto,
  CreateCurrencyDto,
  CreateLanguageDto,
  CreateLocaleDto,
  CreateRegionDto,
  SetAssociationDto,
  UpdateCityDto,
  UpdateCountryDto,
  UpdateCurrencyDto,
  UpdateLanguageDto,
  UpdateLocaleDto,
  UpdateRegionDto,
} from './dto/reference.dto';

@ApiTags('admin-reference')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('admin/reference')
export class AdminReferenceController {
  constructor(private readonly reference: ReferenceService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Admin list countries (includes inactive)' })
  adminListCountries() {
    return this.reference.adminListCountries(true);
  }

  @Post('countries')
  @ApiOperation({ summary: 'Create country' })
  createCountry(@Body() body: CreateCountryDto) {
    return this.reference.createCountry(body);
  }

  @Patch('countries/:id')
  @ApiOperation({ summary: 'Update country' })
  updateCountry(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateCountryDto) {
    return this.reference.updateCountry(id, body);
  }

  @Post('countries/:id/associations')
  @ApiOperation({ summary: 'Upsert country association (language/locale/currency/TZ/dialing)' })
  setAssociation(@Param('id', ParseUUIDPipe) id: string, @Body() body: SetAssociationDto) {
    return this.reference.setCountryAssociation(id, body.type, body.targetId, body.isPrimary);
  }

  @Post('languages')
  @ApiOperation({ summary: 'Create language' })
  createLanguage(@Body() body: CreateLanguageDto) {
    return this.reference.createLanguage(body);
  }

  @Patch('languages/:id')
  @ApiOperation({ summary: 'Update language' })
  updateLanguage(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateLanguageDto) {
    return this.reference.updateLanguage(id, body);
  }

  @Post('currencies')
  @ApiOperation({ summary: 'Create currency' })
  createCurrency(@Body() body: CreateCurrencyDto) {
    return this.reference.createCurrency(body);
  }

  @Patch('currencies/:id')
  @ApiOperation({ summary: 'Update currency' })
  updateCurrency(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateCurrencyDto) {
    return this.reference.updateCurrency(id, body);
  }

  @Post('locales')
  @ApiOperation({ summary: 'Create locale' })
  createLocale(@Body() body: CreateLocaleDto) {
    return this.reference.createLocale(body);
  }

  @Patch('locales/:id')
  @ApiOperation({ summary: 'Update locale' })
  updateLocale(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateLocaleDto) {
    return this.reference.updateLocale(id, body);
  }

  @Post('regions')
  @ApiOperation({ summary: 'Create region' })
  createRegion(@Body() body: CreateRegionDto) {
    return this.reference.createRegion(body);
  }

  @Patch('regions/:id')
  @ApiOperation({ summary: 'Update region' })
  updateRegion(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateRegionDto) {
    return this.reference.updateRegion(id, body);
  }

  @Post('cities')
  @ApiOperation({ summary: 'Create city' })
  createCity(@Body() body: CreateCityDto) {
    return this.reference.createCity(body);
  }

  @Patch('cities/:id')
  @ApiOperation({ summary: 'Update city' })
  updateCity(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateCityDto) {
    return this.reference.updateCity(id, body);
  }
}
