import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { identityConfig } from '../../common/config/identity.config';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { IdentityController } from './adapters/http/identity.controller';
import { JwtStrategy } from './adapters/http/strategies/jwt.strategy';
import { GoogleAuthAdapter } from './adapters/oauth/google-auth.adapter';
import { MockSmsAdapter } from './adapters/sms/mock-sms.adapter';
import { AuthService } from './application/auth.service';
import { OtpService } from './application/otp.service';
import { ProfileService } from './application/profile.service';
import { SessionService } from './application/session.service';
import { TokenService } from './application/token.service';
import { GOOGLE_AUTH_PROVIDER } from './domain/ports/google-auth.port';
import { SMS_PROVIDER } from './domain/ports/sms-provider.port';

@Module({
  imports: [
    ConfigModule.forFeature(identityConfig),
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('identity.jwtAccessSecret'),
      }),
    }),
  ],
  controllers: [IdentityController],
  providers: [
    AuthService,
    OtpService,
    ProfileService,
    SessionService,
    TokenService,
    JwtStrategy,
    MockSmsAdapter,
    GoogleAuthAdapter,
    { provide: SMS_PROVIDER, useExisting: MockSmsAdapter },
    { provide: GOOGLE_AUTH_PROVIDER, useExisting: GoogleAuthAdapter },
  ],
  exports: [AuthService, ProfileService, JwtModule],
})
export class IdentityModule {}
