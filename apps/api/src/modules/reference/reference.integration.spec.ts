import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { AppModule } from '../../app/app.module';

const hasDatabase = Boolean(process.env.DATABASE_URL);

(hasDatabase ? describe : describe.skip)('Reference integration (Postgres)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const suffix = Date.now().toString(36);
  let adminToken = '';
  let userToken = '';
  let saCountryId = '';

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh';

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

    for (const role of [
      { code: 'super_admin', name: 'Super Admin' },
      { code: 'moderator', name: 'Moderator' },
      { code: 'user', name: 'User' },
    ]) {
      await prisma.role.upsert({
        where: { code: role.code },
        update: { name: role.name },
        create: role,
      });
    }

    const sa = await prisma.country.findUnique({ where: { iso2: 'SA' } });
    if (!sa) {
      throw new Error('Seed SA country missing — run pnpm db:seed before tests');
    }
    saCountryId = sa.id;

    const password = 'Password1!';
    const passwordHash = await bcrypt.hash(password, 10);

    const adminEmail = `ref.admin.${suffix}@example.com`;
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        displayName: 'Ref Admin',
        accountType: 'regular',
        status: 'active',
      },
    });
    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'super_admin' } });
    await prisma.userRoleAssignment.create({
      data: { userId: adminUser.id, roleId: superAdminRole.id },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/identity/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = adminLogin.body.tokens.accessToken;

    const userEmail = `ref.user.${suffix}@example.com`;
    const userRegister = await request(app.getHttpServer())
      .post('/api/v1/identity/auth/register')
      .send({ email: userEmail, password, displayName: 'Ref User' })
      .expect(201);
    userToken = userRegister.body.tokens.accessToken;
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('lists active countries with SA associations and AR translation', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/reference/countries')
      .query({ lang: 'ar' })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const sa = res.body.find((c: { iso2: string }) => c.iso2 === 'SA');
    expect(sa).toBeTruthy();
    expect(sa.name).toContain('السعودية');
    expect(sa.dialingCode).toBe('+966');
    expect(
      sa.currencies.some(
        (c: { code: string; isPrimary: boolean }) => c.code === 'SAR' && c.isPrimary,
      ),
    ).toBe(true);
    expect(
      sa.languages.some(
        (l: { code: string; isPrimary: boolean }) => l.code === 'ar' && l.isPrimary,
      ),
    ).toBe(true);
    expect(
      sa.locales.some(
        (l: { code: string; isPrimary: boolean }) => l.code === 'ar-SA' && l.isPrimary,
      ),
    ).toBe(true);
  });

  it('lists SA regions and cities from public API', async () => {
    const regions = await request(app.getHttpServer())
      .get('/api/v1/reference/regions')
      .query({ countryId: saCountryId, lang: 'ar' })
      .expect(200);

    expect(regions.body.length).toBeGreaterThanOrEqual(3);
    expect(regions.body.some((r: { code: string }) => r.code === 'RIY')).toBe(true);

    const cities = await request(app.getHttpServer())
      .get('/api/v1/reference/cities')
      .query({ countryId: saCountryId, lang: 'ar' })
      .expect(200);

    expect(
      cities.body.some((c: { name: string }) => c.name === 'الرياض' || c.name === 'Riyadh'),
    ).toBe(true);
  });

  it('lists languages and currencies publicly', async () => {
    const languages = await request(app.getHttpServer())
      .get('/api/v1/reference/languages')
      .expect(200);
    expect(languages.body.some((l: { code: string }) => l.code === 'ar')).toBe(true);

    const currencies = await request(app.getHttpServer())
      .get('/api/v1/reference/currencies')
      .expect(200);
    expect(currencies.body.some((c: { code: string }) => c.code === 'SAR')).toBe(true);
  });

  it('rejects admin mutations for non-admin users', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/reference/languages')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: `xx${suffix}`.slice(0, 8), name: 'Nope' })
      .expect(403);
  });

  it('allows super_admin CRUD for language and enforces unique code', async () => {
    const code = `t${suffix}`.slice(0, 8);
    const created = await request(app.getHttpServer())
      .post('/api/v1/admin/reference/languages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, name: 'Test Lang', isRtl: false })
      .expect(201);

    expect(created.body.code).toBe(code.toLowerCase());

    await request(app.getHttpServer())
      .post('/api/v1/admin/reference/languages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, name: 'Dup' })
      .expect(409);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/reference/languages/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Lang Updated', isActive: false })
      .expect(200);
  });

  it('creates hierarchical region + city and returns translated names', async () => {
    const regionCode = `T${suffix}`.slice(0, 8).toUpperCase();
    const region = await request(app.getHttpServer())
      .post('/api/v1/admin/reference/regions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        countryId: saCountryId,
        code: regionCode,
        name: 'Test Region',
        translations: [
          { languageCode: 'ar', value: 'منطقة اختبار' },
          { languageCode: 'en', value: 'Test Region' },
        ],
      })
      .expect(201);

    const child = await request(app.getHttpServer())
      .post('/api/v1/admin/reference/regions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        countryId: saCountryId,
        code: `${regionCode}-C`,
        name: 'Child Region',
        parentId: region.body.id,
      })
      .expect(201);

    expect(child.body.parentId).toBe(region.body.id);

    const city = await request(app.getHttpServer())
      .post('/api/v1/admin/reference/cities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        regionId: region.body.id,
        name: 'Test City',
        latitude: 24.0,
        longitude: 46.0,
        translations: [
          { languageCode: 'ar', value: 'مدينة اختبار' },
          { languageCode: 'en', value: 'Test City' },
        ],
      })
      .expect(201);

    const listed = await request(app.getHttpServer())
      .get('/api/v1/reference/cities')
      .query({ regionId: region.body.id, lang: 'ar' })
      .expect(200);

    expect(
      listed.body.some(
        (c: { id: string; name: string }) => c.id === city.body.id && c.name === 'مدينة اختبار',
      ),
    ).toBe(true);
  });

  it('enforces single primary currency association at DB level', async () => {
    const currency = await prisma.currency.create({
      data: { code: `X${suffix}`.slice(0, 6).toUpperCase(), name: 'Temp', minorUnits: 2 },
    });

    await expect(
      prisma.countryCurrency.create({
        data: { countryId: saCountryId, currencyId: currency.id, isPrimary: true },
      }),
    ).rejects.toThrow();

    await prisma.currency.delete({ where: { id: currency.id } });
  });
});
