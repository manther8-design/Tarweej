import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../../application/auth.service';
import { OtpService } from '../../application/otp.service';
import { ProfileService } from '../../application/profile.service';
import { SessionService } from '../../application/session.service';
import type { AuthenticatedUser } from '../../domain/identity.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import {
  GoogleAuthDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  RequestOtpDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('identity')
@Controller('identity')
export class IdentityController {
  constructor(
    private readonly auth: AuthService,
    private readonly otp: OtpService,
    private readonly profile: ProfileService,
    private readonly sessions: SessionService,
  ) {}

  @Post('auth/register')
  @ApiOperation({ summary: 'Register with email + password' })
  async register(@Body() body: RegisterDto, @Req() req: Request) {
    return this.auth.register({
      ...body,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Post('auth/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email + password' })
  async login(@Body() body: LoginDto, @Req() req: Request) {
    return this.auth.login({
      ...body,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Post('auth/refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  async refresh(@Body() body: RefreshDto, @Req() req: Request) {
    return this.auth.refresh({
      refreshToken: body.refreshToken,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Post('auth/logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current session' })
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.auth.logout(user.sessionId);
    return { revoked: true };
  }

  @Post('auth/google')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with Google (adapter; stub-friendly)' })
  async google(@Body() body: GoogleAuthDto, @Req() req: Request) {
    return this.auth.loginWithGoogle({
      idToken: body.idToken,
      deviceLabel: body.deviceLabel,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Post('otp/request')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request phone OTP via SMS provider port' })
  async requestOtp(@Body() body: RequestOtpDto) {
    return this.otp.requestOtp(body);
  }

  @Post('otp/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify phone OTP and issue session' })
  async verifyOtp(@Body() body: VerifyOtpDto, @Req() req: Request) {
    return this.otp.verifyOtp({
      ...body,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current authenticated user' })
  @ApiOkResponse({ description: 'Authenticated user profile' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.profile.getMe(user.id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.profile.getMe(user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile' })
  async updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateProfileDto) {
    return this.profile.updateProfile(user.id, body);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active device sessions' })
  async listSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.sessions.listSessions(user.id, user.sessionId);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke another device session' })
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sessions.revokeSession(user.id, id, user.sessionId);
  }

  @Get('admin/ping')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin-only RBAC probe' })
  adminPing(@CurrentUser() user: AuthenticatedUser) {
    return {
      ok: true,
      userId: user.id,
      roles: user.roles,
    };
  }
}
