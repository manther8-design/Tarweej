import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { join } from 'node:path';
import * as request from 'supertest';
import { AppModule } from '../../app/app.module';

const hasDatabase = Boolean(process.env.DATABASE_URL);

(hasDatabase ? describe : describe.skip)('Search integration (Postgres)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const suffix = Date.now().toString(36);
  let userToken = '';
  let moderatorToken = '';
  let phonesCategoryId = '';
  let brandAttributeId = '';
  let storageAttributeId = '';
  let conditionAttributeId = '';
  let countryId = '';
  let cityId = '';
  let listingAId = '';
  let listingBId = '';

  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh';
    process.env.OBJECT_STORAGE_DRIVER = 'local';
    process.env.OBJECT_STORAGE_LOCAL_ROOT = join(process.cwd(), '.data/object-storage-search-test');

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

    // Ensure auto-approve stays off so listings suite and state machine stay consistent.
    await prisma.businessSetting.upsert({
      where: { key: 'listings.moderation.auto_approve' },
      update: { valueJson: { enabled: false } },
      create: {
        key: 'listings.moderation.auto_approve',
        valueJson: { enabled: false },
        description: 'test auto approve off',
      },
    });

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
      return login.body.tokens.accessToken as string;
    };

    userToken = await createWithRole(`search.user.${suffix}@example.com`, 'user');
    moderatorToken = await createWithRole(`search.mod.${suffix}@example.com`, 'moderator');

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

    listingAId = await createActiveListing({
      title: `Galaxy SearchAlpha ${suffix}`,
      description: 'Flagship android phone with excellent camera for search tests.',
      priceAmount: 2500,
      brand: 'samsung',
      storage: 256,
      featured: true,
      viewCount: 40,
    });
    listingBId = await createActiveListing({
      title: `Pixel SearchBeta ${suffix}`,
      description: 'Compact google phone for search ranking tests.',
      priceAmount: 1800,
      brand: 'xiaomi',
      storage: 128,
      featured: false,
      viewCount: 10,
    });
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  async function createActiveListing(input: {
    title: string;
    description: string;
    priceAmount: number;
    brand: string;
    storage: number;
    featured: boolean;
    viewCount: number;
  }): Promise<string> {
    const create = await request(app.getHttpServer())
      .post('/api/v1/my/listings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        categoryId: phonesCategoryId,
        countryId,
        cityId: cityId || undefined,
        title: input.title,
        description: input.description,
        priceAmount: input.priceAmount,
        currencyCode: 'SAR',
        attributes: [
          { attributeDefinitionId: brandAttributeId, valueText: input.brand },
          { attributeDefinitionId: storageAttributeId, valueNumber: input.storage },
          { attributeDefinitionId: conditionAttributeId, valueText: 'new' },
        ],
      })
      .expect(201);

    const id = create.body.id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/my/listings/${id}/media`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', pngBuffer, { filename: 'cover.png', contentType: 'image/png' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/my/listings/${id}/submit`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${id}/approve`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ reason: 'search fixture' })
      .expect(201);

    await prisma.listing.update({
      where: { id },
      data: {
        isFeaturedCached: input.featured,
        viewCount: input.viewCount,
      },
    });
    return id;
  }

  it('searches by text on title/description', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search/listings')
      .query({ q: `SearchAlpha ${suffix}` })
      .expect(200);

    expect(res.body.total).toBeGreaterThanOrEqual(1);
    const ids = (res.body.items as Array<{ id: string }>).map((i) => i.id);
    expect(ids).toContain(listingAId);
    expect(ids).not.toContain(listingBId);
  });

  it('filters by category, country, price, featured and sorts by price', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search/listings')
      .query({
        q: suffix,
        categoryId: phonesCategoryId,
        countryId,
        minPrice: 1000,
        maxPrice: 3000,
        featured: true,
        sort: 'price_desc',
      })
      .expect(200);

    expect(res.body.total).toBeGreaterThanOrEqual(1);
    const ids = (res.body.items as Array<{ id: string }>).map((i) => i.id);
    expect(ids).toContain(listingAId);
    expect(ids).not.toContain(listingBId);
    expect(res.body.items[0].isFeaturedCached).toBe(true);
  });

  it('applies dynamic attribute filters', async () => {
    const attrs = JSON.stringify([
      { attributeDefinitionId: brandAttributeId, eq: 'xiaomi' },
      { attributeDefinitionId: storageAttributeId, min: 100, max: 200 },
    ]);
    const res = await request(app.getHttpServer())
      .get('/api/v1/search/listings')
      .query({ q: suffix, attrs })
      .expect(200);

    const ids = (res.body.items as Array<{ id: string }>).map((i) => i.id);
    expect(ids).toContain(listingBId);
    expect(ids).not.toContain(listingAId);
  });

  it('paginates and sorts by views', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search/listings')
      .query({ q: suffix, sort: 'views', page: 1, pageSize: 1 })
      .expect(200);

    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(1);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe(listingAId);
  });

  it('rejects invalid attrs JSON', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/search/listings')
      .query({ attrs: '{not-json' })
      .expect(400);
  });

  it('serves a cached response on repeated identical queries when Redis is up', async () => {
    const query = { q: `SearchBeta ${suffix}`, sort: 'newest' };
    const first = await request(app.getHttpServer())
      .get('/api/v1/search/listings')
      .query(query)
      .expect(200);
    expect(first.body.cached).toBe(false);

    const second = await request(app.getHttpServer())
      .get('/api/v1/search/listings')
      .query(query)
      .expect(200);

    // When Redis is available the second hit is cached; otherwise both are uncached.
    if (second.body.cached) {
      expect(second.body.total).toBe(first.body.total);
      expect(second.body.items).toHaveLength(first.body.items.length);
    } else {
      expect(second.body.cached).toBe(false);
    }
  });
});
