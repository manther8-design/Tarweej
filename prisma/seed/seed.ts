/**
 * Dev-only seed: languages, countries, currencies, roles, and a few associations.
 * Do not run against production without review.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  await linkLanguage(sa.id, ar.id, true);
  await linkLanguage(sa.id, en.id, false);
  await linkLanguage(ae.id, ar.id, true);
  await linkLanguage(ae.id, en.id, false);
  await linkLanguage(us.id, en.id, true);

  await linkCurrency(sa.id, sar.id, true);
  await linkCurrency(ae.id, aed.id, true);
  await linkCurrency(us.id, usd.id, true);

  await linkTimeZone(sa.id, riyadhTz.id, true);
  await linkTimeZone(ae.id, dubaiTz.id, true);
  await linkTimeZone(us.id, nyTz.id, true);

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
  console.log('Seed complete: languages/countries/currencies/roles/settings');
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
