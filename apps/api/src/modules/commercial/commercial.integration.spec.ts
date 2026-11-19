import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHmac } from 'node:crypto';
import { join } from 'node:path';
import * as request from 'supertest';
import { AppModule } from '../../app/app.module';

const hasDatabase = Boolean(process.env.DATABASE_URL);

(hasDatabase ? describe : describe.skip)('Commercial integration (Postgres)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const suffix = Date.now().toString(36);
  let sellerToken = '';
  let buyerToken = '';
  let adminToken = '';
  let moderatorToken = '';
  let countryId = '';
  let cityId = '';
  let phonesCategoryId = '';
  let brandAttributeId = '';
  let storageAttributeId = '';
  let conditionAttributeId = '';
  let listingId = '';
  let pricingRuleId = '';
  const webhookSecret =
    process.env.PAYMENT_MOCK_WEBHOOK_SECRET ?? process.env.JWT_ACCESS_SECRET ?? 'test-access';

  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh';
    process.env.PAYMENT_MOCK_WEBHOOK_SECRET = webhookSecret;
    process.env.OBJECT_STORAGE_DRIVER = 'local';
    process.env.OBJECT_STORAGE_LOCAL_ROOT = join(
      process.cwd(),
      '.data/object-storage-commercial-test',
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
      'payments.pricing.read',
      'payments.pricing.write',
      'payments.routes.read',
      'payments.routes.write',
      'listings.moderate',
    ]) {
      const permission = await prisma.permission.upsert({
        where: { code: perm },
        update: {},
        create: { code: perm, name: perm, description: perm },
      });
      for (const roleCode of perm.startsWith('listings')
        ? (['super_admin', 'moderator'] as const)
        : (['super_admin'] as const)) {
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

    const seller = await createWithRole(`com.seller.${suffix}@example.com`, 'user');
    const buyer = await createWithRole(`com.buyer.${suffix}@example.com`, 'user');
    const admin = await createWithRole(`com.admin.${suffix}@example.com`, 'super_admin');
    const moderator = await createWithRole(`com.mod.${suffix}@example.com`, 'moderator');
    sellerToken = seller.token;
    buyerToken = buyer.token;
    adminToken = admin.token;
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

    await prisma.paymentProviderRoute.upsert({
      where: { countryId_providerCode: { countryId, providerCode: 'mock' } },
      update: { isActive: true, priority: 1 },
      create: { countryId, providerCode: 'mock', priority: 1, isActive: true },
    });

    const rule = await prisma.featuredPricingRule.upsert({
      where: {
        countryId_placement_currencyCode: {
          countryId,
          placement: 'home',
          currencyCode: 'SAR',
        },
      },
      update: {
        pricePerHour: 2,
        maxSlots: 7,
        defaultDurationHours: 24,
        minDurationHours: 1,
        maxDurationHours: 72,
        isActive: true,
      },
      create: {
        countryId,
        placement: 'home',
        currencyCode: 'SAR',
        pricePerHour: 2,
        maxSlots: 7,
        defaultDurationHours: 24,
        minDurationHours: 1,
        maxDurationHours: 72,
        isActive: true,
      },
    });
    pricingRuleId = rule.id;

    const draft = await request(app.getHttpServer())
      .post('/api/v1/my/listings')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        categoryId: phonesCategoryId,
        countryId,
        cityId: cityId || undefined,
        title: `Featured phone ${suffix}`,
        description: 'Commercial test listing for featured purchase',
        priceAmount: 900,
        currencyCode: 'SAR',
        attributes: [
          { attributeDefinitionId: brandAttributeId, valueText: 'samsung' },
          { attributeDefinitionId: storageAttributeId, valueNumber: 128 },
          { attributeDefinitionId: conditionAttributeId, valueText: 'new' },
        ],
      })
      .expect(201);

    listingId = draft.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/my/listings/${listingId}/media`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .attach('file', pngBuffer, { filename: 'a.png', contentType: 'image/png' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/my/listings/${listingId}/submit`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/listings/${listingId}/approve`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ reason: 'commercial fixture' })
      .expect(201);
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('lists public pricing plans', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/promotions/plans')
      .query({ countryId })
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((p: { id: string }) => p.id === pricingRuleId)).toBe(true);
  });

  it('rejects featured purchase by non-owner', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/promotions/purchase')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        listingId,
        pricingRuleId,
        durationHours: 2,
        idempotencyKey: `deny-${suffix}`,
      })
      .expect(403);
  });

  it('purchases featured, completes via mock webhook, activates, and expires', async () => {
    const idempotencyKey = `feat-${suffix}-1`;
    const purchase = await request(app.getHttpServer())
      .post('/api/v1/promotions/purchase')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        listingId,
        pricingRuleId,
        durationHours: 2,
        idempotencyKey,
      })
      .expect(201);

    expect(purchase.body.payment.status).toBe('processing');
    expect(purchase.body.promotion.status).toBe('scheduled');
    expect(purchase.body.checkout.sandbox).toBe(true);
    const paymentId = purchase.body.payment.id as string;

    // Idempotent replay returns same payment.
    const replay = await request(app.getHttpServer())
      .post('/api/v1/promotions/purchase')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        listingId,
        pricingRuleId,
        durationHours: 2,
        idempotencyKey,
      })
      .expect(201);
    expect(replay.body.reused).toBe(true);
    expect(replay.body.payment.id).toBe(paymentId);

    // Client-only success must not mark Paid — only signed webhook/mock-complete.
    const listingBefore = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
    expect(listingBefore.isFeaturedCached).toBe(false);

    const completed = await request(app.getHttpServer())
      .post(`/api/v1/payments/${paymentId}/mock-complete`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ outcome: 'paid' })
      .expect(201);

    expect(completed.body.payment.status).toBe('paid');
    expect(completed.body.promotion.status).toBe('active');
    expect(completed.body.promotion.isFeaturedVisible).toBe(true);

    const listingPaid = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
    expect(listingPaid.isFeaturedCached).toBe(true);

    // Duplicate webhook event is idempotent.
    const promo = await prisma.featuredPromotion.findUniqueOrThrow({ where: { paymentId } });
    const event = await prisma.webhookEvent.findFirst({
      where: { paymentId, signatureValid: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(event).toBeTruthy();
    if (!event) {
      throw new Error('expected webhook event');
    }

    const payload = {
      eventId: event.providerEventId,
      paymentId,
      outcome: 'paid',
      providerReference: completed.body.payment.providerReference,
    };
    const rawBody = JSON.stringify(payload);
    const signature = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    const dup = await request(app.getHttpServer())
      .post('/api/v1/webhooks/payments/mock')
      .set('Content-Type', 'application/json')
      .set('x-tarweej-signature', signature)
      .send(rawBody)
      .expect(201);
    expect(dup.body.duplicate).toBe(true);

    // Invalid signature rejected.
    await request(app.getHttpServer())
      .post('/api/v1/webhooks/payments/mock')
      .set('Content-Type', 'application/json')
      .set('x-tarweej-signature', 'deadbeef')
      .send(
        JSON.stringify({
          eventId: `bad-${suffix}`,
          paymentId,
          outcome: 'paid',
        }),
      )
      .expect(401);

    // History API
    const history = await request(app.getHttpServer())
      .get('/api/v1/payments')
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);
    expect(history.body.items.some((p: { id: string }) => p.id === paymentId)).toBe(true);

    // Force expiry in the past and run job — never show as featured.
    await prisma.featuredPromotion.update({
      where: { id: promo.id },
      data: { endsAt: new Date(Date.now() - 60_000) },
    });

    const expired = await request(app.getHttpServer())
      .post('/api/v1/admin/commercial/promotions/expire-due')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(expired.body.expiredCount).toBeGreaterThanOrEqual(1);

    const listingExpired = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
    expect(listingExpired.isFeaturedCached).toBe(false);

    const promoExpired = await prisma.featuredPromotion.findUniqueOrThrow({
      where: { id: promo.id },
    });
    expect(promoExpired.status).toBe('expired');
  });

  it('admin can upsert pricing rules and payment routes', async () => {
    const pricing = await request(app.getHttpServer())
      .put('/api/v1/admin/commercial/pricing-rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        countryId,
        currencyCode: 'SAR',
        placement: 'search',
        pricePerHour: 1.5,
        maxSlots: 5,
        defaultDurationHours: 12,
        minDurationHours: 1,
        maxDurationHours: 48,
        isActive: true,
      })
      .expect(200);

    expect(pricing.body.placement).toBe('search');
    expect(Number(pricing.body.pricePerHour)).toBe(1.5);

    const routes = await request(app.getHttpServer())
      .put('/api/v1/admin/commercial/payment-routes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        countryId,
        providerCode: 'mock',
        priority: 5,
        isActive: true,
      })
      .expect(200);
    expect(routes.body.providerCode).toBe('mock');

    await request(app.getHttpServer())
      .get('/api/v1/admin/commercial/pricing-rules')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(403);
  });

  it('rejects unknown provider route codes', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/admin/commercial/payment-routes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        countryId,
        providerCode: 'stripe_live_unknown',
        priority: 1,
        isActive: true,
      })
      .expect(400);
  });
});
