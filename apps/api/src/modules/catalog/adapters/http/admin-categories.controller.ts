import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../identity/adapters/http/decorators/current-user.decorator';
import { RequirePermissions } from '../../../identity/adapters/http/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../identity/adapters/http/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../identity/adapters/http/guards/permissions.guard';
import type { AuthenticatedUser } from '../../../identity/domain/identity.types';
import { CatalogService } from '../../application/catalog.service';
import {
  AttachCategoryAttributeDto,
  CreateAttributeOptionDto,
  CreateAttributeWithOptionsDto,
  CreateCategoryDto,
  UpdateAttributeDefinitionDto,
  UpdateAttributeOptionDto,
  UpdateCategoryAttributeDto,
  UpdateCategoryDto,
} from './dto/catalog.dto';

@ApiTags('admin-categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  // ---- Categories ----

  @Get()
  @RequirePermissions('catalog.categories.read')
  @ApiOperation({ summary: 'Admin list categories (includes inactive)' })
  adminList() {
    return this.catalog.adminListCategories(true);
  }

  @Get('attributes')
  @RequirePermissions('catalog.categories.read')
  @ApiOperation({ summary: 'Admin list all attribute definitions' })
  listAttributes() {
    return this.catalog.adminListAttributes();
  }

  @Get('attributes/:id')
  @RequirePermissions('catalog.categories.read')
  @ApiOperation({ summary: 'Admin get attribute definition' })
  getAttribute(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.adminGetAttribute(id);
  }

  @Post('attributes')
  @RequirePermissions('catalog.categories.write')
  @ApiOperation({ summary: 'Create attribute definition (optional inline options)' })
  createAttribute(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateAttributeWithOptionsDto,
  ) {
    return this.catalog.createAttribute(user.id, body);
  }

  @Patch('attributes/:id')
  @RequirePermissions('catalog.categories.write')
  @ApiOperation({ summary: 'Update attribute definition' })
  updateAttribute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAttributeDefinitionDto,
  ) {
    return this.catalog.updateAttribute(user.id, id, body);
  }

  @Post('attributes/:id/options')
  @RequirePermissions('catalog.categories.write')
  @ApiOperation({ summary: 'Add option to an attribute definition' })
  createOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateAttributeOptionDto,
  ) {
    return this.catalog.createAttributeOption(user.id, id, body);
  }

  @Patch('attribute-options/:optionId')
  @RequirePermissions('catalog.categories.write')
  @ApiOperation({ summary: 'Update an attribute option' })
  updateOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('optionId', ParseUUIDPipe) optionId: string,
    @Body() body: UpdateAttributeOptionDto,
  ) {
    return this.catalog.updateAttributeOption(user.id, optionId, body);
  }

  @Patch('attribute-links/:linkId')
  @RequirePermissions('catalog.categories.write')
  @ApiOperation({ summary: 'Update category↔attribute link' })
  updateLink(
    @CurrentUser() user: AuthenticatedUser,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Body() body: UpdateCategoryAttributeDto,
  ) {
    return this.catalog.updateCategoryAttribute(user.id, linkId, body);
  }

  @Delete('attribute-links/:linkId')
  @RequirePermissions('catalog.categories.write')
  @ApiOperation({ summary: 'Detach attribute from category' })
  detach(@CurrentUser() user: AuthenticatedUser, @Param('linkId', ParseUUIDPipe) linkId: string) {
    return this.catalog.detachAttribute(user.id, linkId);
  }

  @Get(':id')
  @RequirePermissions('catalog.categories.read')
  @ApiOperation({ summary: 'Admin get category with attribute links' })
  adminGet(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.adminGetCategory(id);
  }

  @Post()
  @RequirePermissions('catalog.categories.write')
  @ApiOperation({ summary: 'Create category (audited)' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateCategoryDto) {
    return this.catalog.createCategory(user.id, body);
  }

  @Patch(':id')
  @RequirePermissions('catalog.categories.write')
  @ApiOperation({ summary: 'Update category (audited)' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.catalog.updateCategory(user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('catalog.categories.write')
  @ApiOperation({ summary: 'Soft-delete category (audited)' })
  softDelete(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.softDeleteCategory(user.id, id);
  }

  @Post(':id/attributes')
  @RequirePermissions('catalog.categories.write')
  @ApiOperation({ summary: 'Attach attribute definition to category' })
  attach(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AttachCategoryAttributeDto,
  ) {
    return this.catalog.attachAttribute(user.id, id, body);
  }
}
