export type AccountType = 'regular' | 'commercial' | 'moderator' | 'super_admin';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  phoneE164: string | null;
  displayName: string | null;
  accountType: string;
  status: string;
  preferredLanguageCode: string | null;
  countryId: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  roles: string[];
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResult {
  user: Omit<AuthenticatedUser, 'sessionId'>;
  tokens: TokenPair;
  sessionId: string;
}
