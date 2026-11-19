import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { TokenPair } from '../domain/identity.types';
import { generateRefreshToken, hashToken } from './crypto.util';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  roles: string[];
  typ: 'access';
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  get accessTtlSeconds(): number {
    return this.config.getOrThrow<number>('identity.accessTtlSeconds');
  }

  get refreshTtlSeconds(): number {
    return this.config.getOrThrow<number>('identity.refreshTtlSeconds');
  }

  async issueAccessToken(input: {
    userId: string;
    sessionId: string;
    roles: string[];
  }): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: input.userId,
      sid: input.sessionId,
      roles: input.roles,
      typ: 'access',
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('identity.jwtAccessSecret'),
      expiresIn: this.accessTtlSeconds,
    });
  }

  mintRefreshToken(): { token: string; hash: string; expiresAt: Date } {
    const token = generateRefreshToken();
    const hash = hashToken(token);
    const expiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);
    return { token, hash, expiresAt };
  }

  hashRefreshToken(token: string): string {
    return hashToken(token);
  }

  async buildTokenPair(input: {
    userId: string;
    sessionId: string;
    roles: string[];
    refreshToken: string;
  }): Promise<TokenPair> {
    const accessToken = await this.issueAccessToken(input);
    return {
      accessToken,
      refreshToken: input.refreshToken,
      accessExpiresIn: this.accessTtlSeconds,
      refreshExpiresIn: this.refreshTtlSeconds,
      tokenType: 'Bearer',
    };
  }
}
