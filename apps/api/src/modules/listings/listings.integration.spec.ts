import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { join } from 'node:path';
import * as request from 'supertest';
import { AppModule } from '../../app/app.module';

const hasDatabase = Boolean(process.env.DATABASE_URL);

(hasDatabase ? describe : describe.skip)('Listings integration (Postgres)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const suffix = Date.now().toString(36);
  let adminToken = '';
  let moderatorToken = '';
  let userToken = '';
  let userId = '';
  let phonesCategoryId = '';
  let brandAttributeId = '';
  let storageAttributeId = '';
  let conditionAttributeId = '';
  let countryId = '';
  let cityId = '';

  // Minimal 1x1 PNG
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh';
    process.env.OBJECT_STORAGE_DRIVER = 'local';
    process.env.OBJECT_STORAGE_LOCAL_ROOT = join(process.cwd(), '.data/object-storage-test');

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

    const moderatePerm = await prisma.permission.findUnique({
      where: { code: 'listings.moderate' },
    });
    if (!moderatePerm) {
      throw new Error('Listings permissions missing — run pnpm db:seed before tests');
    }

    const password = 'Password1!';
    const passwordHash = await bcrypt.hash(password, 10);

    const createWithRole = async (email: string, roleCode: string) => {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName: email,
          accountType: 'regular',
          status: 'active',
        },
      });
      const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
      await prisma.userRoleAssignment.create({
        data: { userId: user.id, roleId: role.id },
      });
      const login = await request(app.getHttpServer())
        .post('/api/v1/identity/auth/login')
        .send({ email, password })
        .expect(200);
      return { token: login.body.tokens.accessToken as string, userId: user.id };
    };

    adminToken = (await createWithRole(`lst.admin.${suffix}@example.com`, 'super_admin')).token;
    moderatorToken = (await createWithRole(`lst.mod.${suffix}@example.com`, 'moderator')).token;
    const user = await createWithRole(`lst.user.${suffix}@example.com`, 'user');
    userToken = user.token;
    userId = user.userId;

    const phones = await prisma.category.findUnique({ where: { slug: 'phones' } });
    const brand = await prisma.attributeDefinition.findUnique({ where: { code: 'brand' } });
    const storage = await prisma.attributeDefinition.findUnique({
      where: { code: 'storage_gb' },
    });
    const condition = await prisma.attributeDefinition.findUnique({
      where: { code: 'condition' },
    });
    const sa = await prisma.country.findUnique({ where: { iso2: 'SA' } });
    const city = await prisma.city.findFirst({
      where: { region: { countryId: sa?.id } },
    });
    if (!phones || !brand || !storage || !condition || !sa) {
      throw new Error('Catalog/reference seed missing — run pnpm db:seed before tests');
    }
    phonesCategoryId = phones.id;
    brandAttributeId = brand.id;
    storageAttributeId = storage.id;
    conditionAttributeId = condition.id;
    countryId = sa.id;
    cityId = city?.id ?? '';
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  const createReadyDraft = async () => {
    const create = await request(app.getHttpServer())
      .post('/api/v1/my/listings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        categoryId: phonesCategoryId,
        countryId,
        cityId: cityId || undefined,
        title: `Pixel ${suffix}`,
        description: 'Integration test listing with enough description text.',
        priceAmount: 1999,
        currencyCode: 'SAR',
        attributes: [
          { attributeDefinitionId: brandAttributeId, valueText: 'xiaomi' },
          { attributeDefinitionId: storageAttributeId, valueNumber: 128 },
          { attributeDefinitionId: conditionAttributeId, valueText: 'new' },
        ],
      })
      .expect(201);

    const listingId = create.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/my/listings/${listingId}/media`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', pngBuffer, { filename: 'cover.png', contentType: 'image/png' })
      .expect(201);

    return listingId;
  };

  it('creates draft, uploads media metadata only, submits for review', async () => {
    const listingId = await createReadyDraft();

    const mediaRows = await prisma.listingMedia.findMany({ where: { listingId } });
    expect(mediaRows).toHaveLength(1);
    expect(mediaRows[0].storageKey).toContain(`listings/${listingId}/`);
    expect(mediaRows[0].cdnUrl).toBeTruthy();

    const submit = await request(app.getHttpServer())
      .post(`/api/v1/my/listings/${listingId}/submit`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    expect(submit.body.status).toBe('pending_review');

    const history = await prisma.listingStatusHistory.findMany({
      where: { listingId },
      orderBy: { createdAt: 'asc' },
    });
    expect(history.some((h) => h.toStatus === 'pending_review')).toBe(true);
  });

  it('rejects submit without required attributes or media', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/v1/my/listings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        categoryId: phonesCategoryId,
        countryId,
        title: `Bare ${suffix}`,
        description: 'Missing attributes and media on purpose here.',
        priceAmount: 100,
        currencyCode: 'SAR',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/my/listings/${create.body.id}/submit`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(400);
  });

  it('rejects invalid attribute option values', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/my/listings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        categoryId: phonesCategoryId,
        countryId,
        title: `Bad attr ${suffix}`,
        description: 'Attribute validation should reject this payload.',
        priceAmount: 100,
        currencyCode: 'SAR',
        attributes: [{ attributeDefinitionId: brandAttributeId, valueText: 'nokia' }],
      })
      .expect(400);
  });

  it('moderator approves pending listing with audit; public get + view counter', async () => {
    const listingId = await createReadyDraft();
    await request(app.getHttpServer())
      .post(`/api/v1/my/listings/${listingId}/submit`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/admin/listings/pending')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    const pending = await request(app.getHttpServer())
      .get('/api/v1/admin/listings/pending')
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(200);
    expect(pending.body.items.some((i: { id: string }) => i.id === listingId)).toBe(true);

    const approve = await request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${listingId}/approve`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ reason: 'Looks good' })
      .expect(201);
    expect(approve.body.status).toBe('active');

    const audit = await prisma.auditEntry.findFirst({
      where: { entityType: 'listing', entityId: listingId, action: 'listing.approve' },
    });
    expect(audit).not.toBeNull();

    const pub = await request(app.getHttpServer()).get(`/api/v1/listings/${listingId}`).expect(200);
    expect(pub.body.title).toContain('Pixel');
    expect(pub.body.media.length).toBeGreaterThanOrEqual(1);

    const before = pub.body.viewCount as number;
    const viewed = await request(app.getHttpServer())
      .post(`/api/v1/listings/${listingId}/views`)
      .send({ fingerprint: `fp-${suffix}` })
      .expect(201);
    expect(viewed.body.viewCount).toBe(before + 1);

    const views = await prisma.listingView.count({ where: { listingId } });
    expect(views).toBeGreaterThanOrEqual(1);
  });

  it('moderator rejects with reason and audit', async () => {
    const listingId = await createReadyDraft();
    await request(app.getHttpServer())
      .post(`/api/v1/my/listings/${listingId}/submit`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    const rejected = await request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${listingId}/reject`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ reason: 'Incomplete photos' })
      .expect(201);
    expect(rejected.body.status).toBe('rejected');
    expect(rejected.body.rejectionReason).toBe('Incomplete photos');

    const audit = await prisma.auditEntry.findFirst({
      where: { entityType: 'listing', entityId: listingId, action: 'listing.reject' },
    });
    expect(audit).not.toBeNull();
  });

  it('lists own listings and hides non-active from public get', async () => {
    const listingId = await createReadyDraft();
    const mine = await request(app.getHttpServer())
      .get('/api/v1/my/listings')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(mine.body.items.some((i: { id: string }) => i.id === listingId)).toBe(true);

    await request(app.getHttpServer()).get(`/api/v1/listings/${listingId}`).expect(404);
  });

  it('admin can also moderate', async () => {
    const listingId = await createReadyDraft();
    await request(app.getHttpServer())
      .post(`/api/v1/my/listings/${listingId}/submit`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${listingId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(201);
  });

  it('does not store binary payloads in listing_media rows', async () => {
    const listingId = await createReadyDraft();
    const media = await prisma.listingMedia.findFirstOrThrow({ where: { listingId } });
    const raw = JSON.stringify(media);
    expect(raw.includes(pngBuffer.toString('base64'))).toBe(false);
    expect(media.storageKey.startsWith('listings/')).toBe(true);
    void userId;
  });
});
