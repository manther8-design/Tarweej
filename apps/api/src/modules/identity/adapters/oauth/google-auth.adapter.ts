import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GoogleAuthPort, GoogleIdentityProfile } from '../../domain/ports/google-auth.port';

/**
 * Google auth adapter stub.
 * When GOOGLE_AUTH_ENABLED=false or client id missing, verifyIdToken fails closed.
 * Structure is ready for real token verification without vendor lock-in at the port.
 */
@Injectable()
export class GoogleAuthAdapter implements GoogleAuthPort {
  constructor(private readonly config: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<GoogleIdentityProfile> {
    const enabled = this.config.get<boolean>('identity.googleAuthEnabled') === true;
    const clientId = this.config.get<string>('identity.googleClientId') ?? '';

    if (!enabled || !clientId) {
      throw new ServiceUnavailableException(
        'Google sign-in is not enabled or GOOGLE_CLIENT_ID is missing',
      );
    }

    if (!idToken || idToken.trim().length < 10) {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    // Dev/test hook: tokens prefixed with "stub." decode a fake profile without calling Google.
    if (idToken.startsWith('stub.')) {
      const subject = idToken.slice('stub.'.length) || 'google-stub-subject';
      return {
        subject,
        email: `${subject}@gmail.com`,
        emailVerified: true,
        displayName: `Google ${subject}`,
      };
    }

    throw new ServiceUnavailableException(
      'Real Google token verification is not configured in this environment',
    );
  }
}
