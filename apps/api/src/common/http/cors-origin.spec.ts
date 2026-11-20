import { createCorsOriginDelegate, isLocalDevOrigin, parseCorsOrigins } from './cors-origin';

describe('cors-origin', () => {
  describe('isLocalDevOrigin', () => {
    it.each([
      'http://localhost',
      'http://localhost:61808',
      'https://localhost:443',
      'http://127.0.0.1',
      'http://127.0.0.1:3000',
      'https://127.0.0.1:5173',
    ])('allows %s', (origin) => {
      expect(isLocalDevOrigin(origin)).toBe(true);
    });

    it.each([
      'http://evil.example',
      'http://localhost.evil.com',
      'http://127.0.0.1.evil.com',
      'https://example.com',
      'ftp://localhost:21',
      '',
    ])('rejects %s', (origin) => {
      expect(isLocalDevOrigin(origin)).toBe(false);
    });
  });

  describe('parseCorsOrigins', () => {
    it('splits and trims configured origins', () => {
      expect(parseCorsOrigins(' http://localhost:3000 , http://localhost:3001 ')).toEqual([
        'http://localhost:3000',
        'http://localhost:3001',
      ]);
    });

    it('returns empty for blank input', () => {
      expect(parseCorsOrigins(undefined)).toEqual([]);
      expect(parseCorsOrigins('')).toEqual([]);
      expect(parseCorsOrigins(' , ')).toEqual([]);
    });
  });

  describe('createCorsOriginDelegate', () => {
    function decide(
      nodeEnv: string,
      configuredOrigins: string[],
      origin: string | undefined,
    ): Promise<boolean> {
      const delegate = createCorsOriginDelegate({ nodeEnv, configuredOrigins });
      return new Promise((resolve, reject) => {
        delegate(origin, (err, allow) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(Boolean(allow));
        });
      });
    }

    it('allows missing Origin (non-browser)', async () => {
      await expect(decide('production', [], undefined)).resolves.toBe(true);
    });

    it('allows exact CORS_ORIGINS matches in production', async () => {
      await expect(
        decide('production', ['https://app.tarweej.example'], 'https://app.tarweej.example'),
      ).resolves.toBe(true);
    });

    it('rejects localhost in production unless listed', async () => {
      await expect(
        decide('production', ['https://app.tarweej.example'], 'http://localhost:61808'),
      ).resolves.toBe(false);
    });

    it('allows Flutter web localhost any port in development', async () => {
      await expect(
        decide('development', ['http://localhost:3000'], 'http://localhost:61808'),
      ).resolves.toBe(true);
      await expect(decide('development', [], 'http://127.0.0.1:9999')).resolves.toBe(true);
    });

    it('still allows configured origins in development', async () => {
      await expect(
        decide('development', ['https://preview.example'], 'https://preview.example'),
      ).resolves.toBe(true);
    });

    it('rejects non-local origins outside the allow-list', async () => {
      await expect(
        decide('development', ['http://localhost:3000'], 'https://evil.example'),
      ).resolves.toBe(false);
    });
  });
});
