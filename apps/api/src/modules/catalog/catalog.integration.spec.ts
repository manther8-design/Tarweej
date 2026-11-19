import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { AppModule } from '../../app/app.module';

const hasDatabase = Boolean(process.env.DATABASE_URL);

(hasDatabase ? describe : describe.skip)('Catalog categories integration (Postgres)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const suffix = Date.now().toString(36);
  let adminToken = '';
  let moderatorToken = '';
  let userToken = '';
  let phonesCategoryId = '';
  let brandAttributeId = '';

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

    const catalogPerm = await prisma.permission.findUnique({
      where: { code: 'catalog.categories.write' },
    });
    if (!catalogPerm) {
      throw new Error('Catalog permissions missing — run pnpm db:seed before tests');
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

    adminToken = await createWithRole(`cat.admin.${suffix}@example.com`, 'super_admin');
    moderatorToken = await createWithRole(`cat.mod.${suffix}@example.com`, 'moderator');
    userToken = await createWithRole(`cat.user.${suffix}@example.com`, 'user');

    const phones = await prisma.category.findUnique({ where: { slug: 'phones' } });
    const brand = await prisma.attributeDefinition.findUnique({ where: { code: 'brand' } });
    if (!phones || !brand) {
      throw new Error('Catalog seed tree missing — run pnpm db:seed before tests');
    }
    phonesCategoryId = phones.id;
    brandAttributeId = brand.id;
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('returns public category hierarchy with seed tree', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/categories').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const marketplace = res.body.find((c: { slug: string }) => c.slug === 'marketplace');
    expect(marketplace).toBeDefined();
    expect(marketplace.children.some((c: { slug: string }) => c.slug === 'electronics')).toBe(true);
    const electronics = marketplace.children.find(
      (c: { slug: string }) => c.slug === 'electronics',
    );
    expect(electronics.children.some((c: { slug: string }) => c.slug === 'phones')).toBe(true);
  });

  it('returns category attributes for phones', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/categories/${phonesCategoryId}`)
      .query({ lang: 'en' })
      .expect(200);

    expect(res.body.slug).toBe('phones');
    expect(res.body.attributes.length).toBeGreaterThanOrEqual(3);
    const brand = res.body.attributes.find((a: { code: string }) => a.code === 'brand');
    expect(brand).toBeDefined();
    expect(brand.dataType).toBe('single_select');
    expect(brand.isRequired).toBe(true);
    expect(brand.options.some((o: { value: string }) => o.value === 'apple')).toBe(true);
  });

  it('translates category names when lang=ar', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/categories')
      .query({ lang: 'ar' })
      .expect(200);

    const marketplace = res.body.find((c: { slug: string }) => c.slug === 'marketplace');
    expect(marketplace.name).toBe('السوق');
  });

  it('rejects admin list without auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/categories').expect(401);
  });

  it('rejects admin write without permission', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ slug: `denied-${suffix}`, name: 'Denied' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ slug: `denied-mod-${suffix}`, name: 'Denied Mod' })
      .expect(403);
  });

  it('allows moderator to read admin categories', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${moderatorToken}`)
      .expect(200);
    expect(res.body.some((c: { slug: string }) => c.slug === 'phones')).toBe(true);
  });

  it('creates category, attaches attribute, and writes audit', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slug: `tablets-${suffix}`,
        name: 'Tablets',
        parentId: (await prisma.category.findUniqueOrThrow({ where: { slug: 'electronics' } })).id,
        sortOrder: 30,
        translations: { en: 'Tablets', ar: 'أجهزة لوحية' },
      })
      .expect(201);

    expect(create.body.slug).toBe(`tablets-${suffix}`);
    const categoryId = create.body.id as string;

    const attach = await request(app.getHttpServer())
      .post(`/api/v1/admin/categories/${categoryId}/attributes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        attributeDefinitionId: brandAttributeId,
        sortOrder: 5,
        isRequiredOverride: true,
      })
      .expect(201);

    expect(attach.body.attributeDefinitionId).toBe(brandAttributeId);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/categories/${categoryId}`)
      .expect(200);
    expect(detail.body.attributes.some((a: { code: string }) => a.code === 'brand')).toBe(true);

    const audit = await prisma.auditEntry.findFirst({
      where: { entityType: 'category', entityId: categoryId, action: 'category.create' },
    });
    expect(audit).not.toBeNull();

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer()).get(`/api/v1/categories/${categoryId}`).expect(404);
  });

  it('creates attribute definition with options', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/categories/attributes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: `color_${suffix}`,
        name: 'Color',
        dataType: 'single_select',
        isRequired: false,
        options: [
          { value: 'black', label: 'Black', sortOrder: 1 },
          { value: 'white', label: 'White', sortOrder: 2 },
        ],
      })
      .expect(201);

    expect(res.body.code).toBe(`color_${suffix}`);
    expect(res.body.options).toHaveLength(2);
  });

  it('rejects cyclic parent assignment', async () => {
    const marketplace = await prisma.category.findUniqueOrThrow({
      where: { slug: 'marketplace' },
    });
    const electronics = await prisma.category.findUniqueOrThrow({
      where: { slug: 'electronics' },
    });

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/categories/${marketplace.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ parentId: electronics.id })
      .expect(400);
  });
});
