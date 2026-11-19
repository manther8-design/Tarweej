import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { join } from 'node:path';
import * as request from 'supertest';
import { AppModule } from '../../app/app.module';

const hasDatabase = Boolean(process.env.DATABASE_URL);

(hasDatabase ? describe : describe.skip)('Engagement integration (Postgres)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const suffix = Date.now().toString(36);
  let sellerToken = '';
  let buyerToken = '';
  let strangerToken = '';
  let sellerId = '';
  let buyerId = '';
  let phonesCategoryId = '';
  let brandAttributeId = '';
  let storageAttributeId = '';
  let conditionAttributeId = '';
  let countryId = '';
  let cityId = '';
  let listingId = '';
  let conversationId = '';

  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh';
    process.env.OBJECT_STORAGE_DRIVER = 'local';
    process.env.OBJECT_STORAGE_LOCAL_ROOT = join(
      process.cwd(),
      '.data/object-storage-engagement-test',
    );

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
      return {
        token: login.body.tokens.accessToken as string,
        userId: user.id,
      };
    };

    const seller = await createWithRole(`eng.seller.${suffix}@example.com`, 'user');
    const buyer = await createWithRole(`eng.buyer.${suffix}@example.com`, 'user');
    const stranger = await createWithRole(`eng.stranger.${suffix}@example.com`, 'user');
    const moderator = await createWithRole(`eng.mod.${suffix}@example.com`, 'moderator');
    sellerToken = seller.token;
    sellerId = seller.userId;
    buyerToken = buyer.token;
    buyerId = buyer.userId;
    strangerToken = stranger.token;

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

    const create = await request(app.getHttpServer())
      .post('/api/v1/my/listings')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        categoryId: phonesCategoryId,
        countryId,
        cityId: cityId || undefined,
        title: `Engagement Phone ${suffix}`,
        description: 'Listing used for favorites and chat integration tests.',
        priceAmount: 1200,
        currencyCode: 'SAR',
        attributes: [
          { attributeDefinitionId: brandAttributeId, valueText: 'samsung' },
          { attributeDefinitionId: storageAttributeId, valueNumber: 128 },
          { attributeDefinitionId: conditionAttributeId, valueText: 'new' },
        ],
      })
      .expect(201);

    listingId = create.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/my/listings/${listingId}/media`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .attach('file', pngBuffer, { filename: 'cover.png', contentType: 'image/png' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/my/listings/${listingId}/submit`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${listingId}/approve`)
      .set('Authorization', `Bearer ${moderator.token}`)
      .send({ reason: 'engagement fixture' })
      .expect(201);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  describe('favorites', () => {
    it('adds, lists, and removes favorites', async () => {
      const add = await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId })
        .expect(201);

      expect(add.body.listingId).toBe(listingId);

      const status = await request(app.getHttpServer())
        .get(`/api/v1/favorites/status/${listingId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);
      expect(status.body.favorited).toBe(true);

      const list = await request(app.getHttpServer())
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);
      expect(list.body.total).toBeGreaterThanOrEqual(1);
      const item = (list.body.items as Array<{ listingId: string; availability: string }>).find(
        (row) => row.listingId === listingId,
      );
      expect(item?.availability).toBe('available');

      await request(app.getHttpServer())
        .delete(`/api/v1/favorites/${listingId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      const after = await request(app.getHttpServer())
        .get(`/api/v1/favorites/status/${listingId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);
      expect(after.body.favorited).toBe(false);
    });

    it('denies favoriting own listing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ listingId })
        .expect(403);
    });

    it('lists expired favorites as expired without failing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/favorites')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId })
        .expect(201);

      await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'expired' },
      });

      const list = await request(app.getHttpServer())
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      const item = (list.body.items as Array<{ listingId: string; availability: string }>).find(
        (row) => row.listingId === listingId,
      );
      expect(item?.availability).toBe('expired');

      await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'active' },
      });
    });
  });

  describe('conversations', () => {
    it('opens conversation, sends messages, marks read', async () => {
      const open = await request(app.getHttpServer())
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId })
        .expect(201);

      conversationId = open.body.id as string;
      expect(open.body.buyerId).toBe(buyerId);
      expect(open.body.sellerId).toBe(sellerId);
      expect(open.body.myRole).toBe('buyer');

      const again = await request(app.getHttpServer())
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId })
        .expect(201);
      expect(again.body.id).toBe(conversationId);

      const msg = await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ body: `Hello seller ${suffix}` })
        .expect(201);
      expect(msg.body.body).toContain(suffix);
      expect(msg.body.readAt).toBeNull();

      const sellerList = await request(app.getHttpServer())
        .get('/api/v1/conversations')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);
      const thread = (sellerList.body.items as Array<{ id: string; unreadCount: number }>).find(
        (row) => row.id === conversationId,
      );
      expect(thread?.unreadCount).toBeGreaterThanOrEqual(1);

      const read = await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversationId}/read`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(201);
      expect(read.body.markedRead).toBeGreaterThanOrEqual(1);

      const messages = await request(app.getHttpServer())
        .get(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);
      expect(messages.body.total).toBeGreaterThanOrEqual(1);
      expect(messages.body.items[0].readAt).not.toBeNull();

      await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ body: `Reply from seller ${suffix}` })
        .expect(201);
    });

    it('denies non-participants and own-listing open', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ body: 'intrusion' })
        .expect(403);

      await request(app.getHttpServer())
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ listingId })
        .expect(403);
    });
  });
});
