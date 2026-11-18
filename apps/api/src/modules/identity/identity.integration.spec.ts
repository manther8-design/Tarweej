import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../../app/app.module';
import { MockSmsAdapter } from './adapters/sms/mock-sms.adapter';
import { SMS_PROVIDER } from './domain/ports/sms-provider.port';
import * as bcrypt from 'bcryptjs';

const hasDatabase = Boolean(process.env.DATABASE_URL);

(hasDatabase ? describe : describe.skip)('Identity integration (Postgres)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let sms: MockSmsAdapter;
  const suffix = Date.now().toString(36);

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh';
    process.env.GOOGLE_AUTH_ENABLED = 'true';
    process.env.GOOGLE_CLIENT_ID = 'test-client';
    process.env.OTP_RATE_LIMIT_MAX = '20';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();

    prisma = new PrismaClient();
    await prisma.$connect();
    sms = moduleRef.get(MockSmsAdapter);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('register → login → refresh → me → logout', async () => {
    const email = `identity.${suffix}@example.com`;
    const password = 'Password1!';

    const register = await request(app.getHttpServer())
      .post('/api/v1/identity/auth/register')
      .send({ email, password, displayName: 'Tester', deviceLabel: 'jest' })
      .expect(201);

    expect(register.body.tokens.accessToken).toBeTruthy();
    expect(register.body.tokens.refreshToken).toBeTruthy();
    expect(register.body.user.email).toBe(email);
    expect(register.body.user.roles).toContain('user');

    const login = await request(app.getHttpServer())
      .post('/api/v1/identity/auth/login')
      .send({ email, password, deviceLabel: 'jest-login' })
      .expect(200);

    const refresh = await request(app.getHttpServer())
      .post('/api/v1/identity/auth/refresh')
      .send({ refreshToken: login.body.tokens.refreshToken })
      .expect(200);

    expect(refresh.body.tokens.refreshToken).not.toEqual(login.body.tokens.refreshToken);

    const me = await request(app.getHttpServer())
      .get('/api/v1/identity/me')
      .set('Authorization', `Bearer ${refresh.body.tokens.accessToken}`)
      .expect(200);

    expect(me.body.email).toBe(email);

    await request(app.getHttpServer())
      .post('/api/v1/identity/auth/logout')
      .set('Authorization', `Bearer ${refresh.body.tokens.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/identity/me')
      .set('Authorization', `Bearer ${refresh.body.tokens.accessToken}`)
      .expect(401);
  });

  it('OTP happy path with mock SMS provider', async () => {
    const phone = `+9665${String(Date.now()).slice(-8)}`;
    sms.sent.length = 0;

    const requested = await request(app.getHttpServer())
      .post('/api/v1/identity/otp/request')
      .send({ phoneE164: phone })
      .expect(200);

    expect(requested.body.challengeId).toBeTruthy();
    expect(requested.body.provider).toBe('mock');
    expect(sms.sent.length).toBeGreaterThan(0);

    const body = sms.sent[sms.sent.length - 1]?.body ?? '';
    const match = body.match(/(\d{6})/);
    expect(match?.[1]).toBeTruthy();
    const code = match?.[1] ?? '';

    const verified = await request(app.getHttpServer())
      .post('/api/v1/identity/otp/verify')
      .send({ phoneE164: phone, code })
      .expect(200);

    expect(verified.body.tokens.accessToken).toBeTruthy();
    expect(verified.body.user.phoneE164).toBe(phone);
  });

  it('protects admin ping with RBAC roles from DB', async () => {
    const email = `admin.${suffix}@example.com`;
    const password = 'Password1!';

    const register = await request(app.getHttpServer())
      .post('/api/v1/identity/auth/register')
      .send({ email, password })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/identity/admin/ping')
      .set('Authorization', `Bearer ${register.body.tokens.accessToken}`)
      .expect(403);

    const user = await prisma.user.findFirstOrThrow({ where: { email } });
    const role = await prisma.role.findUniqueOrThrow({ where: { code: 'moderator' } });
    await prisma.userRoleAssignment.create({
      data: { userId: user.id, roleId: role.id },
    });

    // Need fresh tokens so JWT roles / DB roles align after assignment.
    const login = await request(app.getHttpServer())
      .post('/api/v1/identity/auth/login')
      .send({ email, password })
      .expect(200);

    const ping = await request(app.getHttpServer())
      .get('/api/v1/identity/admin/ping')
      .set('Authorization', `Bearer ${login.body.tokens.accessToken}`)
      .expect(200);

    expect(ping.body.ok).toBe(true);
    expect(ping.body.roles).toEqual(expect.arrayContaining(['moderator']));
  });

  it('google stub path when enabled', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/v1/identity/auth/google')
      .send({ idToken: `stub.google-${suffix}`, deviceLabel: 'google-test' })
      .expect(200);

    expect(result.body.user.email).toContain('@gmail.com');
    expect(result.body.tokens.accessToken).toBeTruthy();
  });

  it('never stores plaintext passwords', async () => {
    const email = `hash.${suffix}@example.com`;
    const password = 'Password1!';
    await request(app.getHttpServer())
      .post('/api/v1/identity/auth/register')
      .send({ email, password })
      .expect(201);

    const user = await prisma.user.findFirstOrThrow({ where: { email } });
    expect(user.passwordHash).toBeTruthy();
    expect(user.passwordHash).not.toEqual(password);
    const hash = user.passwordHash ?? '';
    await expect(bcrypt.compare(password, hash)).resolves.toBe(true);
  });
});

describe('Identity unit smoke', () => {
  it('SMS_PROVIDER token is defined', () => {
    expect(SMS_PROVIDER).toBeDefined();
  });
});
