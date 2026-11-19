import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../identity/adapters/http/decorators/current-user.decorator';
import { RequirePermissions } from '../../../identity/adapters/http/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../identity/adapters/http/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../identity/adapters/http/guards/permissions.guard';
import type { AuthenticatedUser } from '../../../identity/domain/identity.types';
import { RbacService } from '../../application/rbac.service';
import { AssignRoleDto } from './dto/configuration.dto';

@ApiTags('admin-rbac')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/rbac')
export class AdminRbacController {
  constructor(private readonly rbac: RbacService) {}

  @Get('roles')
  @RequirePermissions('rbac.roles.read')
  @ApiOperation({ summary: 'List roles with assigned permissions' })
  listRoles() {
    return this.rbac.listRoles();
  }

  @Get('permissions')
  @RequirePermissions('rbac.roles.read')
  @ApiOperation({ summary: 'List permission catalog' })
  listPermissions() {
    return this.rbac.listPermissions();
  }

  @Get('users/:userId/roles')
  @RequirePermissions('rbac.roles.read')
  @ApiOperation({ summary: 'List roles assigned to a user' })
  getUserRoles(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.rbac.getUserRoles(userId);
  }

  @Post('users/:userId/roles')
  @RequirePermissions('rbac.assign')
  @ApiOperation({ summary: 'Assign a role to a user (audited)' })
  assignRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: AssignRoleDto,
  ) {
    return this.rbac.assignRole(user.id, userId, body.roleCode);
  }

  @Delete('users/:userId/roles/:roleCode')
  @RequirePermissions('rbac.assign')
  @ApiOperation({ summary: 'Revoke a role from a user (audited)' })
  revokeRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('roleCode') roleCode: string,
  ) {
    return this.rbac.revokeRole(user.id, userId, roleCode);
  }
}
