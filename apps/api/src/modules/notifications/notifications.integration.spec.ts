import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { join } from 'node:path';
import * as request from 'supertest';
import { AppModule } from '../../app/app.module';

const hasDatabase = Boolean(process.env.DATABASE_URL);

(hasDatabase ? describe : describe.skip)('Notifications & Reports integration (Postgres)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const suffix = Date.now().toString(36);
  let sellerToken = '';
  let buyerToken = '';
  let moderatorToken = '';
  let sellerId = '';
  let buyerId = '';
  let countryId = '';
  let cityId = '';
  let phonesCategoryId = '';
  let brandAttributeId = '';
  let storageAttributeId = '';
  let conditionAttributeId = '';
  let listingId = '';
  let pendingListingId = '';

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
      '.data/object-storage-notifications-test',
    );

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication({ rawBody: true });
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

    for (const perm of [
      'listings.moderate',
      'listings.read',
      'reports.read',
      'reports.moderate',
      'payments.pricing.read',
      'payments.pricing.write',
      'payments.routes.read',
    ]) {
      const permission = await prisma.permission.upsert({
        where: { code: perm },
        update: {},
        create: { code: perm, name: perm, description: perm },
      });
      for (const roleCode of ['super_admin', 'moderator'] as const) {
        const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: permission.id },
          },
          update: {},
          create: { roleId: role.id, permissionId: permission.id },
        });
      }
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

    const seller = await createWithRole(`ntf.seller.${suffix}@example.com`, 'user');
    const buyer = await createWithRole(`ntf.buyer.${suffix}@example.com`, 'user');
    const moderator = await createWithRole(`ntf.mod.${suffix}@example.com`, 'moderator');
    sellerToken = seller.token;
    sellerId = seller.userId;
    buyerToken = buyer.token;
    buyerId = buyer.userId;
    moderatorToken = moderator.token;

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

    const createListing = async (title: string) => {
      const create = await request(app.getHttpServer())
        .post('/api/v1/my/listings')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          categoryId: phonesCategoryId,
          countryId,
          cityId: cityId || undefined,
          title,
          description: 'Notification/report fixture listing.',
          priceAmount: 900,
          currencyCode: 'SAR',
          attributes: [
            { attributeDefinitionId: brandAttributeId, valueText: 'samsung' },
            { attributeDefinitionId: storageAttributeId, valueNumber: 128 },
            { attributeDefinitionId: conditionAttributeId, valueText: 'new' },
          ],
        })
        .expect(201);

      const id = create.body.id as string;
      await request(app.getHttpServer())
        .post(`/api/v1/my/listings/${id}/media`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .attach('file', pngBuffer, { filename: 'cover.png', contentType: 'image/png' })
        .expect(201);
      await request(app.getHttpServer())
        .post(`/api/v1/my/listings/${id}/submit`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(201);
      return id;
    };

    listingId = await createListing(`Notify Active ${suffix}`);
    await request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${listingId}/approve`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ reason: 'notify fixture' })
      .expect(201);

    pendingListingId = await createListing(`Notify Pending ${suffix}`);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  describe('notifications inbox', () => {
    it('registers device token and lists approve notification', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/notifications/device-tokens')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ token: `fcm-stub-token-${suffix}`, platform: 'android' })
        .expect(201);

      const approved = await prisma.notification.findFirst({
        where: { userId: sellerId, templateCode: 'listing.approved' },
        orderBy: { createdAt: 'desc' },
      });
      expect(approved).toBeTruthy();

      const list = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);
      expect(list.body.total).toBeGreaterThanOrEqual(1);

      const unread = await request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);
      expect(unread.body.unreadCount).toBeGreaterThanOrEqual(1);

      const firstId = list.body.items[0].id as string;
      await request(app.getHttpServer())
        .post(`/api/v1/notifications/${firstId}/read`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(201);

      const after = await request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);
      expect(after.body.unreadCount).toBe(0);
    });

    it('notifies seller on listing reject', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admin/listings/${pendingListingId}/reject`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ reason: 'Missing details' })
        .expect(201);

      const rejected = await prisma.notification.findFirst({
        where: {
          userId: sellerId,
          templateCode: 'listing.rejected',
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(rejected).toBeTruthy();
    });

    it('notifies recipient on new message', async () => {
      const open = await request(app.getHttpServer())
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/conversations/${open.body.id}/messages`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ body: `Notify hello ${suffix}` })
        .expect(201);

      const msgNtf = await prisma.notification.findFirst({
        where: { userId: sellerId, templateCode: 'message.new' },
        orderBy: { createdAt: 'desc' },
      });
      expect(msgNtf).toBeTruthy();
    });

    it('notifies on payment success/fail and featured expiry', async () => {
      const plans = await request(app.getHttpServer())
        .get('/api/v1/promotions/plans')
        .query({ countryId })
        .expect(200);
      const ruleId = (Array.isArray(plans.body) ? plans.body[0]?.id : undefined) as
        | string
        | undefined;
      if (!ruleId) {
        throw new Error('No pricing rule — run pnpm db:seed');
      }

      const purchase = await request(app.getHttpServer())
        .post('/api/v1/promotions/purchase')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          listingId,
          pricingRuleId: ruleId,
          durationHours: 1,
          idempotencyKey: `ntf-pay-${suffix}`,
        })
        .expect(201);

      const paymentId = purchase.body.payment.id as string;

      await request(app.getHttpServer())
        .post(`/api/v1/payments/${paymentId}/mock-complete`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ outcome: 'paid' })
        .expect(201);

      const paidNtf = await prisma.notification.findFirst({
        where: { userId: sellerId, templateCode: 'payment.success' },
        orderBy: { createdAt: 'desc' },
      });
      expect(paidNtf).toBeTruthy();

      const failPurchase = await request(app.getHttpServer())
        .post('/api/v1/promotions/purchase')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          listingId,
          pricingRuleId: ruleId,
          durationHours: 1,
          idempotencyKey: `ntf-fail-${suffix}`,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/payments/${failPurchase.body.payment.id}/mock-complete`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ outcome: 'failed' })
        .expect(201);

      const failNtf = await prisma.notification.findFirst({
        where: { userId: sellerId, templateCode: 'payment.failed' },
        orderBy: { createdAt: 'desc' },
      });
      expect(failNtf).toBeTruthy();

      await prisma.featuredPromotion.updateMany({
        where: { listingId, status: 'active' },
        data: { endsAt: new Date(Date.now() - 60_000) },
      });

      const expired = await request(app.getHttpServer())
        .post('/api/v1/admin/commercial/promotions/expire-due')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(201);
      expect(expired.body.expiredCount).toBeGreaterThanOrEqual(1);

      const expiryNtf = await prisma.notification.findFirst({
        where: { userId: sellerId, templateCode: 'featured.expired' },
        orderBy: { createdAt: 'desc' },
      });
      expect(expiryNtf).toBeTruthy();
    });
  });

  describe('reports moderation', () => {
    it('creates report, classifies, hides listing, closes with audit', async () => {
      const create = await request(app.getHttpServer())
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId,
          reasonCode: 'spam',
          notes: `Looks spammy ${suffix}`,
        })
        .expect(201);

      expect(create.body.status).toBe('open');
      expect(create.body.targetUserId).toBe(sellerId);
      const reportId = create.body.id as string;

      await request(app.getHttpServer())
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ listingId, reasonCode: 'spam' })
        .expect(400);

      await request(app.getHttpServer())
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);

      const queue = await request(app.getHttpServer())
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);
      expect((queue.body.items as Array<{ id: string }>).some((row) => row.id === reportId)).toBe(
        true,
      );

      const classified = await request(app.getHttpServer())
        .post(`/api/v1/admin/reports/${reportId}/classify`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ classification: 'spam' })
        .expect(201);
      expect(classified.body.status).toBe('in_review');
      expect(classified.body.classification).toBe('spam');

      // Ensure listing is active so hide → paused is legal.
      await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'active', deletedAt: null },
      });

      const acted = await request(app.getHttpServer())
        .post(`/api/v1/admin/reports/${reportId}/act`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ action: 'hide_listing', notes: 'Paused for spam' })
        .expect(201);
      expect(acted.body.resolutionAction).toBe('hide_listing');

      const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
      expect(listing.status).toBe('paused');

      const closed = await request(app.getHttpServer())
        .post(`/api/v1/admin/reports/${reportId}/close`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ status: 'resolved', reason: 'Confirmed spam and hidden' })
        .expect(201);
      expect(closed.body.status).toBe('resolved');
      expect(closed.body.resolutionReason).toContain('Confirmed spam');

      const audits = await prisma.auditEntry.findMany({
        where: { entityType: 'report', entityId: reportId },
      });
      const actions = audits.map((a) => a.action);
      expect(actions).toEqual(
        expect.arrayContaining([
          'report.create',
          'report.classify',
          'report.act',
          'report.resolved',
        ]),
      );
    });
  });
});
