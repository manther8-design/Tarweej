import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export type TranslationInput = {
  languageCode: string;
  fieldName?: string;
  value: string;
};

@Injectable()
export class ReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Public reads (active only)
  // ---------------------------------------------------------------------------

  async listCountries(languageCode?: string) {
    const countries = await this.prisma.country.findMany({
      where: { isActive: true },
      orderBy: { iso2: 'asc' },
      include: this.countryInclude(),
    });
    return Promise.all(countries.map((c) => this.mapCountry(c, languageCode)));
  }

  async getCountry(id: string, languageCode?: string) {
    const country = await this.prisma.country.findFirst({
      where: { id, isActive: true },
      include: this.countryInclude(),
    });
    if (!country) {
      throw new NotFoundException('Country not found');
    }
    return this.mapCountry(country, languageCode);
  }

  async listLanguages() {
    return this.prisma.language.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async getLanguage(id: string) {
    const language = await this.prisma.language.findFirst({
      where: { id, isActive: true },
    });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    return language;
  }

  async listCurrencies() {
    return this.prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async getCurrency(id: string) {
    const currency = await this.prisma.currency.findFirst({
      where: { id, isActive: true },
    });
    if (!currency) {
      throw new NotFoundException('Currency not found');
    }
    return currency;
  }

  async listLocales() {
    return this.prisma.locale.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
      include: { language: true },
    });
  }

  async listRegions(countryId?: string, languageCode?: string) {
    const regions = await this.prisma.region.findMany({
      where: {
        isActive: true,
        ...(countryId ? { countryId } : {}),
        country: { isActive: true },
      },
      orderBy: [{ countryId: 'asc' }, { code: 'asc' }],
      include: { parent: true, country: true },
    });
    return Promise.all(regions.map((r) => this.mapRegion(r, languageCode)));
  }

  async getRegion(id: string, languageCode?: string) {
    const region = await this.prisma.region.findFirst({
      where: { id, isActive: true, country: { isActive: true } },
      include: { parent: true, country: true },
    });
    if (!region) {
      throw new NotFoundException('Region not found');
    }
    return this.mapRegion(region, languageCode);
  }

  async listCities(params: { countryId?: string; regionId?: string; languageCode?: string }) {
    const cities = await this.prisma.city.findMany({
      where: {
        isActive: true,
        ...(params.regionId ? { regionId: params.regionId } : {}),
        region: {
          isActive: true,
          ...(params.countryId ? { countryId: params.countryId } : {}),
          country: { isActive: true },
        },
      },
      orderBy: { name: 'asc' },
      include: { region: { include: { country: true } } },
    });
    return Promise.all(cities.map((c) => this.mapCity(c, params.languageCode)));
  }

  async getCity(id: string, languageCode?: string) {
    const city = await this.prisma.city.findFirst({
      where: {
        id,
        isActive: true,
        region: { isActive: true, country: { isActive: true } },
      },
      include: { region: { include: { country: true } } },
    });
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return this.mapCity(city, languageCode);
  }

  // ---------------------------------------------------------------------------
  // Admin CRUD
  // ---------------------------------------------------------------------------

  async adminListCountries(includeInactive = true) {
    return this.prisma.country.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { iso2: 'asc' },
      include: this.countryInclude(),
    });
  }

  async createCountry(input: {
    iso2: string;
    iso3: string;
    dialingCode: string;
    isActive?: boolean;
    translations?: TranslationInput[];
    primaryLanguageId?: string;
    primaryLocaleId?: string;
    primaryCurrencyId?: string;
    primaryTimeZoneId?: string;
  }) {
    const iso2 = input.iso2.toUpperCase();
    const iso3 = input.iso3.toUpperCase();
    try {
      return await this.prisma.$transaction(async (tx) => {
        const dialing = await tx.dialingCode.upsert({
          where: { code: input.dialingCode },
          update: { isActive: true },
          create: { code: input.dialingCode, label: `${iso2} dialing`, isActive: true },
        });

        const country = await tx.country.create({
          data: {
            iso2,
            iso3,
            dialingCode: input.dialingCode,
            isActive: input.isActive ?? true,
          },
        });

        await tx.countryDialingCode.create({
          data: { countryId: country.id, dialingCodeId: dialing.id, isPrimary: true },
        });

        if (input.primaryLanguageId) {
          await tx.countryLanguage.create({
            data: {
              countryId: country.id,
              languageId: input.primaryLanguageId,
              isPrimary: true,
            },
          });
        }
        if (input.primaryLocaleId) {
          await tx.countryLocale.create({
            data: {
              countryId: country.id,
              localeId: input.primaryLocaleId,
              isPrimary: true,
            },
          });
        }
        if (input.primaryCurrencyId) {
          await tx.countryCurrency.create({
            data: {
              countryId: country.id,
              currencyId: input.primaryCurrencyId,
              isPrimary: true,
            },
          });
        }
        if (input.primaryTimeZoneId) {
          await tx.countryTimeZone.create({
            data: {
              countryId: country.id,
              timeZoneId: input.primaryTimeZoneId,
              isPrimary: true,
            },
          });
        }

        await this.upsertTranslations(tx, 'country', country.id, input.translations ?? []);
        return tx.country.findUniqueOrThrow({
          where: { id: country.id },
          include: this.countryInclude(),
        });
      });
    } catch (error) {
      this.rethrowUnique(error, 'Country iso2/iso3 must be unique');
    }
  }

  async updateCountry(
    id: string,
    input: {
      iso2?: string;
      iso3?: string;
      dialingCode?: string;
      isActive?: boolean;
      translations?: TranslationInput[];
    },
  ) {
    await this.requireCountry(id);
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (input.dialingCode) {
          const dialing = await tx.dialingCode.upsert({
            where: { code: input.dialingCode },
            update: { isActive: true },
            create: {
              code: input.dialingCode,
              label: `Dialing ${input.dialingCode}`,
              isActive: true,
            },
          });
          await tx.countryDialingCode.updateMany({
            where: { countryId: id, isPrimary: true },
            data: { isPrimary: false },
          });
          await tx.countryDialingCode.upsert({
            where: {
              countryId_dialingCodeId: { countryId: id, dialingCodeId: dialing.id },
            },
            update: { isPrimary: true },
            create: { countryId: id, dialingCodeId: dialing.id, isPrimary: true },
          });
        }

        const country = await tx.country.update({
          where: { id },
          data: {
            ...(input.iso2 ? { iso2: input.iso2.toUpperCase() } : {}),
            ...(input.iso3 ? { iso3: input.iso3.toUpperCase() } : {}),
            ...(input.dialingCode ? { dialingCode: input.dialingCode } : {}),
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          },
          include: this.countryInclude(),
        });

        if (input.translations) {
          await this.upsertTranslations(tx, 'country', id, input.translations);
        }
        return country;
      });
    } catch (error) {
      this.rethrowUnique(error, 'Country iso2/iso3 must be unique');
    }
  }

  async createLanguage(input: { code: string; name: string; isRtl?: boolean; isActive?: boolean }) {
    try {
      return await this.prisma.language.create({
        data: {
          code: input.code.toLowerCase(),
          name: input.name,
          isRtl: input.isRtl ?? false,
          isActive: input.isActive ?? true,
        },
      });
    } catch (error) {
      this.rethrowUnique(error, 'Language code must be unique');
    }
  }

  async updateLanguage(
    id: string,
    input: { code?: string; name?: string; isRtl?: boolean; isActive?: boolean },
  ) {
    await this.requireLanguage(id);
    try {
      return await this.prisma.language.update({
        where: { id },
        data: {
          ...(input.code ? { code: input.code.toLowerCase() } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.isRtl !== undefined ? { isRtl: input.isRtl } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });
    } catch (error) {
      this.rethrowUnique(error, 'Language code must be unique');
    }
  }

  async createCurrency(input: {
    code: string;
    name: string;
    minorUnits?: number;
    isActive?: boolean;
  }) {
    try {
      return await this.prisma.currency.create({
        data: {
          code: input.code.toUpperCase(),
          name: input.name,
          minorUnits: input.minorUnits ?? 2,
          isActive: input.isActive ?? true,
        },
      });
    } catch (error) {
      this.rethrowUnique(error, 'Currency code must be unique');
    }
  }

  async updateCurrency(
    id: string,
    input: { code?: string; name?: string; minorUnits?: number; isActive?: boolean },
  ) {
    const existing = await this.prisma.currency.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Currency not found');
    }
    try {
      return await this.prisma.currency.update({
        where: { id },
        data: {
          ...(input.code ? { code: input.code.toUpperCase() } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.minorUnits !== undefined ? { minorUnits: input.minorUnits } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });
    } catch (error) {
      this.rethrowUnique(error, 'Currency code must be unique');
    }
  }

  async createLocale(input: {
    code: string;
    languageId: string;
    name: string;
    isActive?: boolean;
  }) {
    await this.requireLanguage(input.languageId);
    try {
      return await this.prisma.locale.create({
        data: {
          code: input.code,
          languageId: input.languageId,
          name: input.name,
          isActive: input.isActive ?? true,
        },
        include: { language: true },
      });
    } catch (error) {
      this.rethrowUnique(error, 'Locale code must be unique');
    }
  }

  async updateLocale(
    id: string,
    input: { code?: string; languageId?: string; name?: string; isActive?: boolean },
  ) {
    const existing = await this.prisma.locale.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Locale not found');
    }
    if (input.languageId) {
      await this.requireLanguage(input.languageId);
    }
    try {
      return await this.prisma.locale.update({
        where: { id },
        data: {
          ...(input.code ? { code: input.code } : {}),
          ...(input.languageId ? { languageId: input.languageId } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        include: { language: true },
      });
    } catch (error) {
      this.rethrowUnique(error, 'Locale code must be unique');
    }
  }

  async createRegion(input: {
    countryId: string;
    code: string;
    name: string;
    parentId?: string;
    isActive?: boolean;
    translations?: TranslationInput[];
  }) {
    await this.requireCountry(input.countryId);
    if (input.parentId) {
      const parent = await this.prisma.region.findUnique({ where: { id: input.parentId } });
      if (!parent || parent.countryId !== input.countryId) {
        throw new BadRequestException('Parent region must belong to the same country');
      }
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const region = await tx.region.create({
          data: {
            countryId: input.countryId,
            code: input.code.toUpperCase(),
            name: input.name,
            parentId: input.parentId,
            isActive: input.isActive ?? true,
          },
        });
        await this.upsertTranslations(tx, 'region', region.id, input.translations ?? []);
        return tx.region.findUniqueOrThrow({
          where: { id: region.id },
          include: { parent: true, country: true },
        });
      });
    } catch (error) {
      this.rethrowUnique(error, 'Region code must be unique within country');
    }
  }

  async updateRegion(
    id: string,
    input: {
      code?: string;
      name?: string;
      parentId?: string | null;
      isActive?: boolean;
      translations?: TranslationInput[];
    },
  ) {
    const region = await this.prisma.region.findUnique({ where: { id } });
    if (!region) {
      throw new NotFoundException('Region not found');
    }
    if (input.parentId) {
      if (input.parentId === id) {
        throw new BadRequestException('Region cannot be its own parent');
      }
      const parent = await this.prisma.region.findUnique({ where: { id: input.parentId } });
      if (!parent || parent.countryId !== region.countryId) {
        throw new BadRequestException('Parent region must belong to the same country');
      }
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.region.update({
          where: { id },
          data: {
            ...(input.code ? { code: input.code.toUpperCase() } : {}),
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          },
          include: { parent: true, country: true },
        });
        if (input.translations) {
          await this.upsertTranslations(tx, 'region', id, input.translations);
        }
        return updated;
      });
    } catch (error) {
      this.rethrowUnique(error, 'Region code must be unique within country');
    }
  }

  async createCity(input: {
    regionId: string;
    name: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
    translations?: TranslationInput[];
  }) {
    const region = await this.prisma.region.findUnique({ where: { id: input.regionId } });
    if (!region) {
      throw new NotFoundException('Region not found');
    }
    return this.prisma.$transaction(async (tx) => {
      const city = await tx.city.create({
        data: {
          regionId: input.regionId,
          name: input.name,
          latitude: input.latitude,
          longitude: input.longitude,
          isActive: input.isActive ?? true,
        },
      });
      await this.upsertTranslations(tx, 'city', city.id, input.translations ?? []);
      return tx.city.findUniqueOrThrow({
        where: { id: city.id },
        include: { region: { include: { country: true } } },
      });
    });
  }

  async updateCity(
    id: string,
    input: {
      name?: string;
      latitude?: number | null;
      longitude?: number | null;
      regionId?: string;
      isActive?: boolean;
      translations?: TranslationInput[];
    },
  ) {
    const existing = await this.prisma.city.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('City not found');
    }
    if (input.regionId) {
      const region = await this.prisma.region.findUnique({ where: { id: input.regionId } });
      if (!region) {
        throw new NotFoundException('Region not found');
      }
    }
    return this.prisma.$transaction(async (tx) => {
      const city = await tx.city.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
          ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
          ...(input.regionId ? { regionId: input.regionId } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        include: { region: { include: { country: true } } },
      });
      if (input.translations) {
        await this.upsertTranslations(tx, 'city', id, input.translations);
      }
      return city;
    });
  }

  async setCountryAssociation(
    countryId: string,
    type: 'language' | 'locale' | 'currency' | 'timeZone' | 'dialingCode',
    targetId: string,
    isPrimary: boolean,
  ) {
    await this.requireCountry(countryId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (isPrimary) {
          await this.clearPrimary(tx, countryId, type);
        }

        switch (type) {
          case 'language':
            return tx.countryLanguage.upsert({
              where: { countryId_languageId: { countryId, languageId: targetId } },
              update: { isPrimary },
              create: { countryId, languageId: targetId, isPrimary },
            });
          case 'locale':
            return tx.countryLocale.upsert({
              where: { countryId_localeId: { countryId, localeId: targetId } },
              update: { isPrimary },
              create: { countryId, localeId: targetId, isPrimary },
            });
          case 'currency':
            return tx.countryCurrency.upsert({
              where: { countryId_currencyId: { countryId, currencyId: targetId } },
              update: { isPrimary },
              create: { countryId, currencyId: targetId, isPrimary },
            });
          case 'timeZone':
            return tx.countryTimeZone.upsert({
              where: { countryId_timeZoneId: { countryId, timeZoneId: targetId } },
              update: { isPrimary },
              create: { countryId, timeZoneId: targetId, isPrimary },
            });
          case 'dialingCode': {
            const link = await tx.countryDialingCode.upsert({
              where: {
                countryId_dialingCodeId: { countryId, dialingCodeId: targetId },
              },
              update: { isPrimary },
              create: { countryId, dialingCodeId: targetId, isPrimary },
            });
            if (isPrimary) {
              const dialing = await tx.dialingCode.findUniqueOrThrow({ where: { id: targetId } });
              await tx.country.update({
                where: { id: countryId },
                data: { dialingCode: dialing.code },
              });
            }
            return link;
          }
          default:
            throw new BadRequestException('Unknown association type');
        }
      });
    } catch (error) {
      this.rethrowUnique(error, 'Association conflict (duplicate or multiple primaries)');
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private countryInclude() {
    return {
      countryLanguages: { include: { language: true } },
      countryLocales: { include: { locale: { include: { language: true } } } },
      countryCurrencies: { include: { currency: true } },
      countryTimeZones: { include: { timeZone: true } },
      countryDialingCodes: { include: { dialingCode: true } },
    } satisfies Prisma.CountryInclude;
  }

  private async mapCountry(
    country: Prisma.CountryGetPayload<{ include: ReturnType<ReferenceService['countryInclude']> }>,
    languageCode?: string,
  ) {
    const name = await this.resolveTranslation('country', country.id, languageCode, country.iso2);
    return {
      id: country.id,
      iso2: country.iso2,
      iso3: country.iso3,
      dialingCode: country.dialingCode,
      isActive: country.isActive,
      name,
      languages: country.countryLanguages.map((row) => ({
        id: row.language.id,
        code: row.language.code,
        name: row.language.name,
        isRtl: row.language.isRtl,
        isPrimary: row.isPrimary,
      })),
      locales: country.countryLocales.map((row) => ({
        id: row.locale.id,
        code: row.locale.code,
        name: row.locale.name,
        languageCode: row.locale.language.code,
        isPrimary: row.isPrimary,
      })),
      currencies: country.countryCurrencies.map((row) => ({
        id: row.currency.id,
        code: row.currency.code,
        name: row.currency.name,
        minorUnits: row.currency.minorUnits,
        isPrimary: row.isPrimary,
      })),
      timeZones: country.countryTimeZones.map((row) => ({
        id: row.timeZone.id,
        ianaName: row.timeZone.ianaName,
        isPrimary: row.isPrimary,
      })),
      dialingCodes: country.countryDialingCodes.map((row) => ({
        id: row.dialingCode.id,
        code: row.dialingCode.code,
        label: row.dialingCode.label,
        isPrimary: row.isPrimary,
      })),
      createdAt: country.createdAt,
      updatedAt: country.updatedAt,
    };
  }

  private async mapRegion(
    region: Prisma.RegionGetPayload<{ include: { parent: true; country: true } }>,
    languageCode?: string,
  ) {
    const name = await this.resolveTranslation('region', region.id, languageCode, region.name);
    return {
      id: region.id,
      countryId: region.countryId,
      countryIso2: region.country.iso2,
      parentId: region.parentId,
      code: region.code,
      name,
      defaultName: region.name,
      isActive: region.isActive,
      createdAt: region.createdAt,
      updatedAt: region.updatedAt,
    };
  }

  private async mapCity(
    city: Prisma.CityGetPayload<{ include: { region: { include: { country: true } } } }>,
    languageCode?: string,
  ) {
    const name = await this.resolveTranslation('city', city.id, languageCode, city.name);
    return {
      id: city.id,
      regionId: city.regionId,
      countryId: city.region.countryId,
      countryIso2: city.region.country.iso2,
      regionCode: city.region.code,
      name,
      defaultName: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      isActive: city.isActive,
      createdAt: city.createdAt,
      updatedAt: city.updatedAt,
    };
  }

  private async resolveTranslation(
    entityType: string,
    entityId: string,
    languageCode: string | undefined,
    fallback: string,
  ): Promise<string> {
    if (!languageCode) {
      return fallback;
    }
    const preferred = await this.prisma.translationString.findUnique({
      where: {
        entityType_entityId_languageCode_fieldName: {
          entityType,
          entityId,
          languageCode,
          fieldName: 'name',
        },
      },
    });
    if (preferred) {
      return preferred.value;
    }
    return fallback;
  }

  private async upsertTranslations(
    tx: Prisma.TransactionClient,
    entityType: string,
    entityId: string,
    translations: TranslationInput[],
  ): Promise<void> {
    for (const item of translations) {
      const fieldName = item.fieldName ?? 'name';
      await tx.translationString.upsert({
        where: {
          entityType_entityId_languageCode_fieldName: {
            entityType,
            entityId,
            languageCode: item.languageCode,
            fieldName,
          },
        },
        update: { value: item.value },
        create: {
          entityType,
          entityId,
          languageCode: item.languageCode,
          fieldName,
          value: item.value,
        },
      });
    }
  }

  private async clearPrimary(
    tx: Prisma.TransactionClient,
    countryId: string,
    type: 'language' | 'locale' | 'currency' | 'timeZone' | 'dialingCode',
  ): Promise<void> {
    switch (type) {
      case 'language':
        await tx.countryLanguage.updateMany({
          where: { countryId, isPrimary: true },
          data: { isPrimary: false },
        });
        break;
      case 'locale':
        await tx.countryLocale.updateMany({
          where: { countryId, isPrimary: true },
          data: { isPrimary: false },
        });
        break;
      case 'currency':
        await tx.countryCurrency.updateMany({
          where: { countryId, isPrimary: true },
          data: { isPrimary: false },
        });
        break;
      case 'timeZone':
        await tx.countryTimeZone.updateMany({
          where: { countryId, isPrimary: true },
          data: { isPrimary: false },
        });
        break;
      case 'dialingCode':
        await tx.countryDialingCode.updateMany({
          where: { countryId, isPrimary: true },
          data: { isPrimary: false },
        });
        break;
    }
  }

  private async requireCountry(id: string): Promise<void> {
    const country = await this.prisma.country.findUnique({ where: { id } });
    if (!country) {
      throw new NotFoundException('Country not found');
    }
  }

  private async requireLanguage(id: string): Promise<void> {
    const language = await this.prisma.language.findUnique({ where: { id } });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
  }

  private rethrowUnique(error: unknown, message: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(message);
    }
    throw error;
  }
}
