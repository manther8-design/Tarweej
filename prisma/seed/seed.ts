/**
 * Dev-only seed: SA-focused reference data + roles/settings.
 * Refuses NODE_ENV=production unless ALLOW_PROD_SEED=true (break-glass).
 */
import { PrismaClient } from '@prisma/client';

if (
  process.env.NODE_ENV === 'production' &&
  (process.env.ALLOW_PROD_SEED ?? '').toLowerCase() !== 'true'
) {
  console.error(
    'Refusing to seed: NODE_ENV=production. Dev seed credentials must not land in prod. Set ALLOW_PROD_SEED=true only for reviewed break-glass.',
  );
  process.exit(1);
}

const prisma = new PrismaClient();

async function upsertTranslation(
  entityType: string,
  entityId: string,
  languageCode: string,
  value: string,
  fieldName = 'name',
): Promise<void> {
  await prisma.translationString.upsert({
    where: {
      entityType_entityId_languageCode_fieldName: {
        entityType,
        entityId,
        languageCode,
        fieldName,
      },
    },
    update: { value },
    create: { entityType, entityId, languageCode, fieldName, value },
  });
}

async function main(): Promise<void> {
  const [ar, en] = await Promise.all([
    prisma.language.upsert({
      where: { code: 'ar' },
      update: { name: 'العربية', isRtl: true, isActive: true },
      create: { code: 'ar', name: 'العربية', isRtl: true, isActive: true },
    }),
    prisma.language.upsert({
      where: { code: 'en' },
      update: { name: 'English', isRtl: false, isActive: true },
      create: { code: 'en', name: 'English', isRtl: false, isActive: true },
    }),
  ]);

  const [arSa, enSa, arAe, enUs] = await Promise.all([
    prisma.locale.upsert({
      where: { code: 'ar-SA' },
      update: { languageId: ar.id, name: 'Arabic (Saudi Arabia)', isActive: true },
      create: { code: 'ar-SA', languageId: ar.id, name: 'Arabic (Saudi Arabia)', isActive: true },
    }),
    prisma.locale.upsert({
      where: { code: 'en-SA' },
      update: { languageId: en.id, name: 'English (Saudi Arabia)', isActive: true },
      create: { code: 'en-SA', languageId: en.id, name: 'English (Saudi Arabia)', isActive: true },
    }),
    prisma.locale.upsert({
      where: { code: 'ar-AE' },
      update: { languageId: ar.id, name: 'Arabic (UAE)', isActive: true },
      create: { code: 'ar-AE', languageId: ar.id, name: 'Arabic (UAE)', isActive: true },
    }),
    prisma.locale.upsert({
      where: { code: 'en-US' },
      update: { languageId: en.id, name: 'English (United States)', isActive: true },
      create: { code: 'en-US', languageId: en.id, name: 'English (United States)', isActive: true },
    }),
  ]);

  const [sar, aed, usd] = await Promise.all([
    prisma.currency.upsert({
      where: { code: 'SAR' },
      update: { name: 'Saudi Riyal', minorUnits: 2, isActive: true },
      create: { code: 'SAR', name: 'Saudi Riyal', minorUnits: 2, isActive: true },
    }),
    prisma.currency.upsert({
      where: { code: 'AED' },
      update: { name: 'UAE Dirham', minorUnits: 2, isActive: true },
      create: { code: 'AED', name: 'UAE Dirham', minorUnits: 2, isActive: true },
    }),
    prisma.currency.upsert({
      where: { code: 'USD' },
      update: { name: 'US Dollar', minorUnits: 2, isActive: true },
      create: { code: 'USD', name: 'US Dollar', minorUnits: 2, isActive: true },
    }),
  ]);

  const [dial966, dial971, dial1] = await Promise.all([
    prisma.dialingCode.upsert({
      where: { code: '+966' },
      update: { label: 'Saudi Arabia', isActive: true },
      create: { code: '+966', label: 'Saudi Arabia', isActive: true },
    }),
    prisma.dialingCode.upsert({
      where: { code: '+971' },
      update: { label: 'United Arab Emirates', isActive: true },
      create: { code: '+971', label: 'United Arab Emirates', isActive: true },
    }),
    prisma.dialingCode.upsert({
      where: { code: '+1' },
      update: { label: 'United States / Canada', isActive: true },
      create: { code: '+1', label: 'United States / Canada', isActive: true },
    }),
  ]);

  const [sa, ae, us] = await Promise.all([
    prisma.country.upsert({
      where: { iso2: 'SA' },
      update: { iso3: 'SAU', dialingCode: '+966', isActive: true },
      create: { iso2: 'SA', iso3: 'SAU', dialingCode: '+966', isActive: true },
    }),
    prisma.country.upsert({
      where: { iso2: 'AE' },
      update: { iso3: 'ARE', dialingCode: '+971', isActive: true },
      create: { iso2: 'AE', iso3: 'ARE', dialingCode: '+971', isActive: true },
    }),
    prisma.country.upsert({
      where: { iso2: 'US' },
      update: { iso3: 'USA', dialingCode: '+1', isActive: true },
      create: { iso2: 'US', iso3: 'USA', dialingCode: '+1', isActive: true },
    }),
  ]);

  await upsertTranslation('country', sa.id, 'ar', 'المملكة العربية السعودية');
  await upsertTranslation('country', sa.id, 'en', 'Saudi Arabia');
  await upsertTranslation('country', ae.id, 'ar', 'الإمارات العربية المتحدة');
  await upsertTranslation('country', ae.id, 'en', 'United Arab Emirates');
  await upsertTranslation('country', us.id, 'ar', 'الولايات المتحدة');
  await upsertTranslation('country', us.id, 'en', 'United States');

  const [riyadhTz, dubaiTz, nyTz] = await Promise.all([
    prisma.timeZone.upsert({
      where: { ianaName: 'Asia/Riyadh' },
      update: {},
      create: { ianaName: 'Asia/Riyadh' },
    }),
    prisma.timeZone.upsert({
      where: { ianaName: 'Asia/Dubai' },
      update: {},
      create: { ianaName: 'Asia/Dubai' },
    }),
    prisma.timeZone.upsert({
      where: { ianaName: 'America/New_York' },
      update: {},
      create: { ianaName: 'America/New_York' },
    }),
  ]);

  const linkLanguage = async (
    countryId: string,
    languageId: string,
    isPrimary: boolean,
  ): Promise<void> => {
    await prisma.countryLanguage.upsert({
      where: { countryId_languageId: { countryId, languageId } },
      update: { isPrimary },
      create: { countryId, languageId, isPrimary },
    });
  };

  const linkLocale = async (
    countryId: string,
    localeId: string,
    isPrimary: boolean,
  ): Promise<void> => {
    await prisma.countryLocale.upsert({
      where: { countryId_localeId: { countryId, localeId } },
      update: { isPrimary },
      create: { countryId, localeId, isPrimary },
    });
  };

  const linkCurrency = async (
    countryId: string,
    currencyId: string,
    isPrimary: boolean,
  ): Promise<void> => {
    await prisma.countryCurrency.upsert({
      where: { countryId_currencyId: { countryId, currencyId } },
      update: { isPrimary },
      create: { countryId, currencyId, isPrimary },
    });
  };

  const linkTimeZone = async (
    countryId: string,
    timeZoneId: string,
    isPrimary: boolean,
  ): Promise<void> => {
    await prisma.countryTimeZone.upsert({
      where: { countryId_timeZoneId: { countryId, timeZoneId } },
      update: { isPrimary },
      create: { countryId, timeZoneId, isPrimary },
    });
  };

  const linkDialing = async (
    countryId: string,
    dialingCodeId: string,
    isPrimary: boolean,
  ): Promise<void> => {
    await prisma.countryDialingCode.upsert({
      where: { countryId_dialingCodeId: { countryId, dialingCodeId } },
      update: { isPrimary },
      create: { countryId, dialingCodeId, isPrimary },
    });
  };

  await linkLanguage(sa.id, ar.id, true);
  await linkLanguage(sa.id, en.id, false);
  await linkLanguage(ae.id, ar.id, true);
  await linkLanguage(ae.id, en.id, false);
  await linkLanguage(us.id, en.id, true);

  await linkLocale(sa.id, arSa.id, true);
  await linkLocale(sa.id, enSa.id, false);
  await linkLocale(ae.id, arAe.id, true);
  await linkLocale(us.id, enUs.id, true);

  await linkCurrency(sa.id, sar.id, true);
  await linkCurrency(ae.id, aed.id, true);
  await linkCurrency(us.id, usd.id, true);

  await linkTimeZone(sa.id, riyadhTz.id, true);
  await linkTimeZone(ae.id, dubaiTz.id, true);
  await linkTimeZone(us.id, nyTz.id, true);

  await linkDialing(sa.id, dial966.id, true);
  await linkDialing(ae.id, dial971.id, true);
  await linkDialing(us.id, dial1.id, true);

  // SA regions + cities
  const riyadhRegion = await prisma.region.upsert({
    where: { countryId_code: { countryId: sa.id, code: 'RIY' } },
    update: { name: 'Riyadh Region', isActive: true, parentId: null },
    create: { countryId: sa.id, code: 'RIY', name: 'Riyadh Region', isActive: true },
  });
  const makkahRegion = await prisma.region.upsert({
    where: { countryId_code: { countryId: sa.id, code: 'MKK' } },
    update: { name: 'Makkah Region', isActive: true, parentId: null },
    create: { countryId: sa.id, code: 'MKK', name: 'Makkah Region', isActive: true },
  });
  const easternRegion = await prisma.region.upsert({
    where: { countryId_code: { countryId: sa.id, code: 'EAS' } },
    update: { name: 'Eastern Region', isActive: true, parentId: null },
    create: { countryId: sa.id, code: 'EAS', name: 'Eastern Region', isActive: true },
  });

  // Example child region under Riyadh (hierarchy demo)
  const riyadhCityArea = await prisma.region.upsert({
    where: { countryId_code: { countryId: sa.id, code: 'RIY-CITY' } },
    update: {
      name: 'Riyadh City Area',
      isActive: true,
      parentId: riyadhRegion.id,
    },
    create: {
      countryId: sa.id,
      code: 'RIY-CITY',
      name: 'Riyadh City Area',
      parentId: riyadhRegion.id,
      isActive: true,
    },
  });

  await upsertTranslation('region', riyadhRegion.id, 'ar', 'منطقة الرياض');
  await upsertTranslation('region', riyadhRegion.id, 'en', 'Riyadh Region');
  await upsertTranslation('region', makkahRegion.id, 'ar', 'منطقة مكة المكرمة');
  await upsertTranslation('region', makkahRegion.id, 'en', 'Makkah Region');
  await upsertTranslation('region', easternRegion.id, 'ar', 'المنطقة الشرقية');
  await upsertTranslation('region', easternRegion.id, 'en', 'Eastern Region');
  await upsertTranslation('region', riyadhCityArea.id, 'ar', 'منطقة مدينة الرياض');
  await upsertTranslation('region', riyadhCityArea.id, 'en', 'Riyadh City Area');

  const upsertCity = async (input: {
    regionId: string;
    name: string;
    latitude: number;
    longitude: number;
    ar: string;
    en: string;
  }) => {
    const existing = await prisma.city.findFirst({
      where: { regionId: input.regionId, name: input.name },
    });
    const city = existing
      ? await prisma.city.update({
          where: { id: existing.id },
          data: {
            latitude: input.latitude,
            longitude: input.longitude,
            isActive: true,
          },
        })
      : await prisma.city.create({
          data: {
            regionId: input.regionId,
            name: input.name,
            latitude: input.latitude,
            longitude: input.longitude,
            isActive: true,
          },
        });
    await upsertTranslation('city', city.id, 'ar', input.ar);
    await upsertTranslation('city', city.id, 'en', input.en);
    return city;
  };

  await upsertCity({
    regionId: riyadhCityArea.id,
    name: 'Riyadh',
    latitude: 24.7136,
    longitude: 46.6753,
    ar: 'الرياض',
    en: 'Riyadh',
  });
  await upsertCity({
    regionId: makkahRegion.id,
    name: 'Jeddah',
    latitude: 21.4858,
    longitude: 39.1925,
    ar: 'جدة',
    en: 'Jeddah',
  });
  await upsertCity({
    regionId: makkahRegion.id,
    name: 'Makkah',
    latitude: 21.3891,
    longitude: 39.8579,
    ar: 'مكة المكرمة',
    en: 'Makkah',
  });
  await upsertCity({
    regionId: easternRegion.id,
    name: 'Dammam',
    latitude: 26.4207,
    longitude: 50.0888,
    ar: 'الدمام',
    en: 'Dammam',
  });
  await upsertCity({
    regionId: easternRegion.id,
    name: 'Khobar',
    latitude: 26.2172,
    longitude: 50.1971,
    ar: 'الخبر',
    en: 'Khobar',
  });

  // Light AE sample
  const dubaiRegion = await prisma.region.upsert({
    where: { countryId_code: { countryId: ae.id, code: 'DU' } },
    update: { name: 'Dubai', isActive: true },
    create: { countryId: ae.id, code: 'DU', name: 'Dubai', isActive: true },
  });
  await upsertTranslation('region', dubaiRegion.id, 'ar', 'دبي');
  await upsertTranslation('region', dubaiRegion.id, 'en', 'Dubai');
  await upsertCity({
    regionId: dubaiRegion.id,
    name: 'Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    ar: 'دبي',
    en: 'Dubai',
  });

  const roles = [
    {
      code: 'super_admin',
      name: 'Super Admin',
      description: 'Full platform configuration and RBAC',
    },
    {
      code: 'moderator',
      name: 'Moderator',
      description: 'Moderation and read access to config',
    },
    { code: 'user', name: 'User', description: 'Standard authenticated user' },
  ];

  const roleByCode: Record<string, { id: string }> = {};
  for (const role of roles) {
    roleByCode[role.code] = await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    });
  }

  const permissions = [
    {
      code: 'config.settings.read',
      name: 'Read business settings',
      description: 'List and view business settings (including secrets in admin)',
    },
    {
      code: 'config.settings.write',
      name: 'Write business settings',
      description: 'Create or update business settings',
    },
    {
      code: 'config.flags.read',
      name: 'Read feature flags',
      description: 'List and view feature flags',
    },
    {
      code: 'config.flags.write',
      name: 'Write feature flags',
      description: 'Create or update feature flags',
    },
    {
      code: 'rbac.roles.read',
      name: 'Read roles & permissions',
      description: 'View roles, permissions, and assignments',
    },
    {
      code: 'rbac.assign',
      name: 'Assign roles',
      description: 'Assign or revoke roles for users',
    },
    {
      code: 'audit.read',
      name: 'Read audit log',
      description: 'View audit entries for admin mutations',
    },
    {
      code: 'dashboard.read',
      name: 'Read admin dashboard',
      description: 'View ops KPI overview aggregations',
    },
    {
      code: 'catalog.categories.read',
      name: 'Read catalog categories',
      description: 'View categories and attribute definitions in admin',
    },
    {
      code: 'catalog.categories.write',
      name: 'Write catalog categories',
      description: 'Create or update categories, attributes, and options',
    },
    {
      code: 'listings.read',
      name: 'Read listings (admin)',
      description: 'View listing details in admin surfaces',
    },
    {
      code: 'listings.write',
      name: 'Write listings (admin)',
      description: 'Admin create/update listings on behalf of ops',
    },
    {
      code: 'listings.moderate',
      name: 'Moderate listings',
      description: 'Approve or reject listings pending review',
    },
    {
      code: 'payments.read',
      name: 'Read payments (admin)',
      description: 'List payment records for ops surfaces',
    },
    {
      code: 'payments.pricing.read',
      name: 'Read featured pricing',
      description: 'View featured promotion pricing rules',
    },
    {
      code: 'payments.pricing.write',
      name: 'Write featured pricing',
      description: 'Create or update featured promotion pricing rules',
    },
    {
      code: 'payments.routes.read',
      name: 'Read payment routes',
      description: 'View country payment provider routes',
    },
    {
      code: 'payments.routes.write',
      name: 'Write payment routes',
      description: 'Create or update country payment provider routes',
    },
    {
      code: 'reports.read',
      name: 'Read reports queue',
      description: 'View user-filed listing/user reports in admin',
    },
    {
      code: 'reports.moderate',
      name: 'Moderate reports',
      description: 'Classify, act on, and close moderation reports',
    },
  ] as const;

  const permissionByCode: Record<string, { id: string }> = {};
  for (const permission of permissions) {
    permissionByCode[permission.code] = await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        description: permission.description,
      },
      create: permission,
    });
  }

  const grant = async (roleCode: string, permissionCodes: readonly string[]) => {
    const role = roleByCode[roleCode];
    if (!role) {
      throw new Error(`Missing role ${roleCode}`);
    }
    for (const code of permissionCodes) {
      const permission = permissionByCode[code];
      if (!permission) {
        throw new Error(`Missing permission ${code}`);
      }
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  };

  await grant(
    'super_admin',
    permissions.map((p) => p.code),
  );
  await grant('moderator', [
    'config.settings.read',
    'config.flags.read',
    'rbac.roles.read',
    'audit.read',
    'dashboard.read',
    'catalog.categories.read',
    'listings.read',
    'listings.moderate',
    'payments.read',
    'payments.pricing.read',
    'payments.routes.read',
    'reports.read',
    'reports.moderate',
  ]);

  await prisma.featureFlag.upsert({
    where: { key: 'identity.google_sign_in' },
    update: {
      description: 'Enable Google sign-in adapter for clients',
    },
    create: {
      key: 'identity.google_sign_in',
      isEnabled: false,
      description: 'Enable Google sign-in adapter for clients',
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'listings.featured_enabled' },
    update: { description: 'Show featured listings placement' },
    create: {
      key: 'listings.featured_enabled',
      isEnabled: true,
      description: 'Show featured listings placement',
    },
  });

  await prisma.businessSetting.upsert({
    where: { key: 'listings.featured_home_count' },
    update: {
      valueJson: { count: 7 },
      description: 'Number of featured ads on home',
      isSecret: false,
    },
    create: {
      key: 'listings.featured_home_count',
      valueJson: { count: 7 },
      description: 'Number of featured ads on home',
      isSecret: false,
    },
  });

  await prisma.businessSetting.upsert({
    where: { key: 'listings.moderation.auto_approve' },
    update: {
      valueJson: { enabled: false },
      description: 'When true, submitting a listing skips pending_review',
      isSecret: false,
    },
    create: {
      key: 'listings.moderation.auto_approve',
      valueJson: { enabled: false },
      description: 'When true, submitting a listing skips pending_review',
      isSecret: false,
    },
  });

  await prisma.businessSetting.upsert({
    where: { key: 'identity.require_email_verification' },
    update: {
      valueJson: { required: false },
      description: 'Require verified email before listing',
      isSecret: false,
    },
    create: {
      key: 'identity.require_email_verification',
      valueJson: { required: false },
      description: 'Require verified email before listing',
      isSecret: false,
    },
  });

  await prisma.businessSetting.upsert({
    where: { key: 'payments.webhook_signing_hint' },
    update: {
      valueJson: { hint: 'dev-only-placeholder' },
      description: 'Internal webhook signing hint (secret)',
      isSecret: true,
    },
    create: {
      key: 'payments.webhook_signing_hint',
      valueJson: { hint: 'dev-only-placeholder' },
      description: 'Internal webhook signing hint (secret)',
      isSecret: true,
    },
  });

  await prisma.businessSetting.upsert({
    where: { key: 'listings.free_window_days' },
    update: {
      valueJson: { days: 365 },
      description: 'Year-1 free normal listing window (days); featured remains paid',
      isSecret: false,
    },
    create: {
      key: 'listings.free_window_days',
      valueJson: { days: 365 },
      description: 'Year-1 free normal listing window (days); featured remains paid',
      isSecret: false,
    },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'payments.featured_checkout' },
    update: { description: 'Enable featured promotion checkout in clients' },
    create: {
      key: 'payments.featured_checkout',
      isEnabled: true,
      description: 'Enable featured promotion checkout in clients',
    },
  });

  // Country payment routing (ADR-011) — mock provider for local/dev.
  for (const country of [sa, ae, us]) {
    await prisma.paymentProviderRoute.upsert({
      where: {
        countryId_providerCode: { countryId: country.id, providerCode: 'mock' },
      },
      update: { priority: 10, isActive: true },
      create: {
        countryId: country.id,
        providerCode: 'mock',
        priority: 10,
        isActive: true,
      },
    });
  }

  // Featured hourly pricing (TRW-010).
  await prisma.featuredPricingRule.upsert({
    where: {
      countryId_placement_currencyCode: {
        countryId: sa.id,
        placement: 'home',
        currencyCode: 'SAR',
      },
    },
    update: {
      pricePerHour: 2.5,
      maxSlots: 7,
      defaultDurationHours: 24,
      minDurationHours: 1,
      maxDurationHours: 168,
      rankWeight: 100,
      isActive: true,
    },
    create: {
      countryId: sa.id,
      placement: 'home',
      currencyCode: 'SAR',
      pricePerHour: 2.5,
      maxSlots: 7,
      defaultDurationHours: 24,
      minDurationHours: 1,
      maxDurationHours: 168,
      rankWeight: 100,
      isActive: true,
    },
  });

  await prisma.featuredPricingRule.upsert({
    where: {
      countryId_placement_currencyCode: {
        countryId: ae.id,
        placement: 'home',
        currencyCode: 'AED',
      },
    },
    update: {
      pricePerHour: 3,
      maxSlots: 7,
      defaultDurationHours: 24,
      isActive: true,
    },
    create: {
      countryId: ae.id,
      placement: 'home',
      currencyCode: 'AED',
      pricePerHour: 3,
      maxSlots: 7,
      defaultDurationHours: 24,
      minDurationHours: 1,
      maxDurationHours: 168,
      rankWeight: 100,
      isActive: true,
    },
  });

  // Dev-only bootstrap admin (password must be changed outside local/dev).
  const bcrypt = await import('bcryptjs');
  const adminEmail = 'admin@tarweej.local';
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      status: 'active',
      deletedAt: null,
      accountType: 'super_admin',
      displayName: 'Tarweej Admin',
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      displayName: 'Tarweej Admin',
      accountType: 'super_admin',
      status: 'active',
      preferredLanguageCode: 'ar',
      emailVerifiedAt: new Date(),
    },
  });
  const superAdminRole = roleByCode['super_admin'];
  if (!superAdminRole) {
    throw new Error('super_admin role missing after upsert');
  }
  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: superAdminRole.id,
    },
  });

  // ---------------------------------------------------------------------------
  // Catalog sample tree: Marketplace → Electronics → Phones (+ attributes)
  // ---------------------------------------------------------------------------

  const upsertCategory = async (input: {
    slug: string;
    name: string;
    parentId?: string | null;
    listingType?: string;
    sortOrder?: number;
    ar: string;
    en: string;
  }) => {
    const row = await prisma.category.upsert({
      where: { slug: input.slug },
      update: {
        name: input.name,
        parentId: input.parentId ?? null,
        listingType: input.listingType ?? 'marketplace',
        sortOrder: input.sortOrder ?? 0,
        isActive: true,
        deletedAt: null,
      },
      create: {
        slug: input.slug,
        name: input.name,
        parentId: input.parentId ?? null,
        listingType: input.listingType ?? 'marketplace',
        sortOrder: input.sortOrder ?? 0,
        isActive: true,
      },
    });
    await upsertTranslation('category', row.id, 'ar', input.ar);
    await upsertTranslation('category', row.id, 'en', input.en);
    return row;
  };

  const marketplace = await upsertCategory({
    slug: 'marketplace',
    name: 'Marketplace',
    sortOrder: 0,
    ar: 'السوق',
    en: 'Marketplace',
  });
  const electronics = await upsertCategory({
    slug: 'electronics',
    name: 'Electronics',
    parentId: marketplace.id,
    sortOrder: 10,
    ar: 'إلكترونيات',
    en: 'Electronics',
  });
  const phones = await upsertCategory({
    slug: 'phones',
    name: 'Phones',
    parentId: electronics.id,
    sortOrder: 10,
    ar: 'هواتف',
    en: 'Phones',
  });
  await upsertCategory({
    slug: 'laptops',
    name: 'Laptops',
    parentId: electronics.id,
    sortOrder: 20,
    ar: 'حواسيب محمولة',
    en: 'Laptops',
  });
  await upsertCategory({
    slug: 'services',
    name: 'Services',
    listingType: 'services',
    sortOrder: 20,
    ar: 'خدمات',
    en: 'Services',
  });

  const brand = await prisma.attributeDefinition.upsert({
    where: { code: 'brand' },
    update: {
      name: 'Brand',
      dataType: 'single_select',
      isRequired: true,
      sortOrder: 10,
      isActive: true,
    },
    create: {
      code: 'brand',
      name: 'Brand',
      dataType: 'single_select',
      isRequired: true,
      sortOrder: 10,
      isActive: true,
    },
  });
  await upsertTranslation('attribute_definition', brand.id, 'ar', 'العلامة التجارية');
  await upsertTranslation('attribute_definition', brand.id, 'en', 'Brand');

  const storageGb = await prisma.attributeDefinition.upsert({
    where: { code: 'storage_gb' },
    update: {
      name: 'Storage',
      dataType: 'int',
      unit: 'GB',
      isRequired: true,
      validationJson: { min: 8, max: 2048 },
      sortOrder: 20,
      isActive: true,
    },
    create: {
      code: 'storage_gb',
      name: 'Storage',
      dataType: 'int',
      unit: 'GB',
      isRequired: true,
      validationJson: { min: 8, max: 2048 },
      sortOrder: 20,
      isActive: true,
    },
  });
  await upsertTranslation('attribute_definition', storageGb.id, 'ar', 'التخزين');
  await upsertTranslation('attribute_definition', storageGb.id, 'en', 'Storage');

  const condition = await prisma.attributeDefinition.upsert({
    where: { code: 'condition' },
    update: {
      name: 'Condition',
      dataType: 'single_select',
      isRequired: true,
      sortOrder: 30,
      isActive: true,
    },
    create: {
      code: 'condition',
      name: 'Condition',
      dataType: 'single_select',
      isRequired: true,
      sortOrder: 30,
      isActive: true,
    },
  });
  await upsertTranslation('attribute_definition', condition.id, 'ar', 'الحالة');
  await upsertTranslation('attribute_definition', condition.id, 'en', 'Condition');

  const warranty = await prisma.attributeDefinition.upsert({
    where: { code: 'has_warranty' },
    update: {
      name: 'Has warranty',
      dataType: 'bool',
      isRequired: false,
      sortOrder: 40,
      isActive: true,
    },
    create: {
      code: 'has_warranty',
      name: 'Has warranty',
      dataType: 'bool',
      isRequired: false,
      sortOrder: 40,
      isActive: true,
    },
  });
  await upsertTranslation('attribute_definition', warranty.id, 'ar', 'يشمل ضمان');
  await upsertTranslation('attribute_definition', warranty.id, 'en', 'Has warranty');

  const upsertOption = async (
    attributeDefinitionId: string,
    value: string,
    label: string,
    sortOrder: number,
    ar: string,
    en: string,
  ) => {
    const existing = await prisma.attributeOption.findUnique({
      where: {
        attributeDefinitionId_value: { attributeDefinitionId, value },
      },
    });
    const option = existing
      ? await prisma.attributeOption.update({
          where: { id: existing.id },
          data: { label, sortOrder, isActive: true },
        })
      : await prisma.attributeOption.create({
          data: { attributeDefinitionId, value, label, sortOrder, isActive: true },
        });
    await upsertTranslation('attribute_option', option.id, 'ar', ar, 'label');
    await upsertTranslation('attribute_option', option.id, 'en', en, 'label');
    return option;
  };

  await upsertOption(brand.id, 'apple', 'Apple', 10, 'أبل', 'Apple');
  await upsertOption(brand.id, 'samsung', 'Samsung', 20, 'سامسونج', 'Samsung');
  await upsertOption(brand.id, 'xiaomi', 'Xiaomi', 30, 'شاومي', 'Xiaomi');
  await upsertOption(condition.id, 'new', 'New', 10, 'جديد', 'New');
  await upsertOption(condition.id, 'used', 'Used', 20, 'مستعمل', 'Used');

  const linkAttr = async (
    categoryId: string,
    attributeDefinitionId: string,
    sortOrder: number,
    isRequiredOverride?: boolean | null,
  ) => {
    await prisma.categoryAttribute.upsert({
      where: {
        categoryId_attributeDefinitionId: { categoryId, attributeDefinitionId },
      },
      update: {
        sortOrder,
        isRequiredOverride: isRequiredOverride ?? null,
        isActive: true,
      },
      create: {
        categoryId,
        attributeDefinitionId,
        sortOrder,
        isRequiredOverride: isRequiredOverride ?? null,
        isActive: true,
      },
    });
  };

  await linkAttr(phones.id, brand.id, 10);
  await linkAttr(phones.id, storageGb.id, 20);
  await linkAttr(phones.id, condition.id, 30);
  await linkAttr(phones.id, warranty.id, 40, false);

  // Sample seller + listings (TRW-007)
  const sellerPassword = await import('bcryptjs').then((b) => b.hash('Seller123!', 10));
  const seller = await prisma.user.upsert({
    where: { email: 'seller@tarweej.local' },
    update: {
      passwordHash: sellerPassword,
      displayName: 'Sample Seller',
      status: 'active',
      countryId: sa.id,
    },
    create: {
      email: 'seller@tarweej.local',
      passwordHash: sellerPassword,
      displayName: 'Sample Seller',
      accountType: 'regular',
      status: 'active',
      countryId: sa.id,
    },
  });
  const userRole = roleByCode.user;
  if (userRole) {
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_roleId: { userId: seller.id, roleId: userRole.id },
      },
      update: {},
      create: { userId: seller.id, roleId: userRole.id },
    });
  }

  const riyadhCity = await prisma.city.findFirst({
    where: { name: 'Riyadh', region: { countryId: sa.id } },
  });

  const existingActive = await prisma.listing.findFirst({
    where: { ownerId: seller.id, title: 'iPhone 15 Pro 256GB' },
  });

  let activeListingId = existingActive?.id;
  if (!existingActive) {
    const active = await prisma.listing.create({
      data: {
        ownerId: seller.id,
        categoryId: phones.id,
        countryId: sa.id,
        cityId: riyadhCity?.id ?? null,
        listingType: 'marketplace',
        title: 'iPhone 15 Pro 256GB',
        description:
          'Seeded sample active listing for Tarweej demos. Excellent condition with box.',
        priceAmount: 4200,
        currencyCode: 'SAR',
        status: 'active',
        publishedAt: new Date(),
        latitude: 24.7136,
        longitude: 46.6753,
      },
    });
    activeListingId = active.id;
    await prisma.listingStatusHistory.create({
      data: {
        listingId: active.id,
        fromStatus: null,
        toStatus: 'draft',
        actorId: seller.id,
        reason: 'seed',
      },
    });
    await prisma.listingStatusHistory.create({
      data: {
        listingId: active.id,
        fromStatus: 'draft',
        toStatus: 'pending_review',
        actorId: seller.id,
        reason: 'seed submit',
      },
    });
    await prisma.listingStatusHistory.create({
      data: {
        listingId: active.id,
        fromStatus: 'pending_review',
        toStatus: 'active',
        actorId: seller.id,
        reason: 'seed approve',
      },
    });
    await prisma.listingAttributeValue.createMany({
      data: [
        {
          listingId: active.id,
          attributeDefinitionId: brand.id,
          valueText: 'apple',
        },
        {
          listingId: active.id,
          attributeDefinitionId: storageGb.id,
          valueNumber: 256,
        },
        {
          listingId: active.id,
          attributeDefinitionId: condition.id,
          valueText: 'used',
        },
        {
          listingId: active.id,
          attributeDefinitionId: warranty.id,
          valueBool: true,
        },
      ],
    });
    // Metadata-only media stub (no binary in Postgres).
    await prisma.listingMedia.create({
      data: {
        listingId: active.id,
        storageKey: `listings/${active.id}/seed-cover.webp`,
        cdnUrl: `http://localhost:3000/api/v1/media/listings/${active.id}/seed-cover.webp`,
        mimeType: 'image/webp',
        byteSize: 0,
        sortOrder: 0,
        status: 'ready',
      },
    });
  }

  const existingPending = await prisma.listing.findFirst({
    where: { ownerId: seller.id, title: 'Samsung Galaxy S24 pending review' },
  });
  if (!existingPending) {
    const pending = await prisma.listing.create({
      data: {
        ownerId: seller.id,
        categoryId: phones.id,
        countryId: sa.id,
        cityId: riyadhCity?.id ?? null,
        listingType: 'marketplace',
        title: 'Samsung Galaxy S24 pending review',
        description: 'Seeded sample listing waiting for moderator approval.',
        priceAmount: 3100,
        currencyCode: 'SAR',
        status: 'pending_review',
      },
    });
    await prisma.listingStatusHistory.create({
      data: {
        listingId: pending.id,
        fromStatus: 'draft',
        toStatus: 'pending_review',
        actorId: seller.id,
        reason: 'seed',
      },
    });
    await prisma.listingAttributeValue.createMany({
      data: [
        {
          listingId: pending.id,
          attributeDefinitionId: brand.id,
          valueText: 'samsung',
        },
        {
          listingId: pending.id,
          attributeDefinitionId: storageGb.id,
          valueNumber: 128,
        },
        {
          listingId: pending.id,
          attributeDefinitionId: condition.id,
          valueText: 'new',
        },
      ],
    });
    await prisma.listingMedia.create({
      data: {
        listingId: pending.id,
        storageKey: `listings/${pending.id}/seed-cover.webp`,
        cdnUrl: `http://localhost:3000/api/v1/media/listings/${pending.id}/seed-cover.webp`,
        mimeType: 'image/webp',
        byteSize: 0,
        sortOrder: 0,
        status: 'ready',
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seed complete: SA reference + roles/permissions + config + catalog + commercial + notifications/reports + sample listings${
      activeListingId ? ` (active=${activeListingId})` : ''
    } + admin@tarweej.local / seller@tarweej.local`,
  );
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
