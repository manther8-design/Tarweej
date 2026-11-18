export const GOOGLE_AUTH_PROVIDER = Symbol('GOOGLE_AUTH_PROVIDER');

export interface GoogleIdentityProfile {
  subject: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
}

export interface GoogleAuthPort {
  /**
   * Verifies an ID token / auth code against Google.
   * Stub implementations may throw when credentials are missing.
   */
  verifyIdToken(idToken: string): Promise<GoogleIdentityProfile>;
}
