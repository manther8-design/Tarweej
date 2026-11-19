import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { AppModule } from '../../app/app.module';

const hasDatabase = Boolean(process.env.DATABASE_URL);

(hasDatabase ? describe : describe.skip)(
  'Configuration / Admin RBAC integration (Postgres)',
  () => {
    let app: INestApplication;
    let prisma: PrismaClient;
    const suffix = Date.now().toString(36);
    let adminToken = '';
    let moderatorToken = '';
    let userToken = '';
    let targetUserId = '';

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

      const permissionCount = await prisma.permission.count();
      if (permissionCount === 0) {
        throw new Error('Permissions missing — run pnpm db:seed before tests');
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
        return { userId: user.id, token: login.body.tokens.accessToken as string };
      };

      const admin = await createWithRole(`cfg.admin.${suffix}@example.com`, 'super_admin');
      adminToken = admin.token;

      const moderator = await createWithRole(`cfg.mod.${suffix}@example.com`, 'moderator');
      moderatorToken = moderator.token;

      const user = await createWithRole(`cfg.user.${suffix}@example.com`, 'user');
      userToken = user.token;
      targetUserId = user.userId;
    });

    afterAll(async () => {
      await app?.close();
      await prisma?.$disconnect();
    });

    it('exposes public settings without secrets', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/configuration/settings')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((s: { key: string }) => s.key === 'listings.featured_home_count')).toBe(
        true,
      );
      expect(res.body.some((s: { key: string }) => s.key === 'payments.webhook_signing_hint')).toBe(
        false,
      );
    });

    it('exposes public feature flags', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/configuration/feature-flags')
        .expect(200);
      expect(res.body.some((f: { key: string }) => f.key === 'identity.google_sign_in')).toBe(true);
    });

    it('rejects unauthenticated admin config reads', async () => {
      await request(app.getHttpServer()).get('/api/v1/admin/configuration/settings').expect(401);
    });

    it('rejects regular users from admin settings', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/configuration/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('allows moderator to read settings but not write', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/configuration/settings')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .put('/api/v1/admin/configuration/settings')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ key: 'listings.featured_home_count', valueJson: { count: 3 } })
        .expect(403);
    });

    it('updates settings and feature flags with audit trail', async () => {
      const setting = await request(app.getHttpServer())
        .put('/api/v1/admin/configuration/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'listings.featured_home_count',
          valueJson: { count: 9 },
          description: 'Number of featured ads on home',
          isSecret: false,
        })
        .expect(200);

      expect(setting.body.valueJson).toEqual({ count: 9 });

      const flag = await request(app.getHttpServer())
        .put('/api/v1/admin/configuration/feature-flags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'identity.google_sign_in',
          isEnabled: true,
          description: 'Enable Google sign-in adapter for clients',
        })
        .expect(200);

      expect(flag.body.isEnabled).toBe(true);

      const audit = await request(app.getHttpServer())
        .get('/api/v1/admin/audit/entries')
        .query({ limit: 20 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(audit.body.length).toBeGreaterThan(0);
      expect(
        audit.body.some(
          (e: { action: string; entityType: string }) =>
            e.action === 'setting.update' && e.entityType === 'business_setting',
        ),
      ).toBe(true);
      expect(
        audit.body.some(
          (e: { action: string; entityType: string }) =>
            e.action === 'feature_flag.update' && e.entityType === 'feature_flag',
        ),
      ).toBe(true);
    });

    it('lists roles/permissions and assigns roles with permission enforcement', async () => {
      const roles = await request(app.getHttpServer())
        .get('/api/v1/admin/rbac/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(roles.body.some((r: { code: string }) => r.code === 'super_admin')).toBe(true);
      const superAdmin = roles.body.find((r: { code: string }) => r.code === 'super_admin');
      expect(superAdmin.permissions.length).toBeGreaterThan(0);

      await request(app.getHttpServer())
        .post(`/api/v1/admin/rbac/users/${targetUserId}/roles`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ roleCode: 'moderator' })
        .expect(403);

      const assigned = await request(app.getHttpServer())
        .post(`/api/v1/admin/rbac/users/${targetUserId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roleCode: 'moderator' })
        .expect(201);

      expect(assigned.body.role.code).toBe('moderator');

      const listed = await request(app.getHttpServer())
        .get(`/api/v1/admin/rbac/users/${targetUserId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listed.body.roles.some((r: { code: string }) => r.code === 'moderator')).toBe(true);

      await request(app.getHttpServer())
        .delete(`/api/v1/admin/rbac/users/${targetUserId}/roles/moderator`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  },
);
