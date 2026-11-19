/**
 * Dev-only seed: SA-focused reference data + roles/settings.
 * Do not run against production without review.
 */
import { PrismaClient } from '@prisma/client';

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
    { code: 'super_admin', name: 'Super Admin' },
    { code: 'moderator', name: 'Moderator' },
    { code: 'user', name: 'User' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: role,
    });
  }

  await prisma.featureFlag.upsert({
    where: { key: 'identity.google_sign_in' },
    update: {},
    create: { key: 'identity.google_sign_in', isEnabled: false },
  });

  await prisma.businessSetting.upsert({
    where: { key: 'listings.featured_home_count' },
    update: { valueJson: { count: 7 } },
    create: { key: 'listings.featured_home_count', valueJson: { count: 7 } },
  });

  // eslint-disable-next-line no-console
  console.log(
    'Seed complete: SA-focused reference (locales/dialing/regions/cities/translations) + roles',
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
