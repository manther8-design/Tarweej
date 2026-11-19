import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../configuration/application/audit.service';

type TranslationMap = Record<string, string>;

export type CategoryTreeNode = {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  listingType: string;
  sortOrder: number;
  children: CategoryTreeNode[];
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Public reads
  // ---------------------------------------------------------------------------

  async listCategoryTree(
    input: { lang?: string; listingType?: string } = {},
  ): Promise<CategoryTreeNode[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        ...(input.listingType ? { listingType: input.listingType } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const names = await this.loadTranslations(
      'category',
      categories.map((c) => c.id),
      input.lang,
    );

    const nodes: CategoryTreeNode[] = categories.map((c) => ({
      id: c.id,
      parentId: c.parentId,
      slug: c.slug,
      name: names.get(c.id) ?? c.name,
      listingType: c.listingType,
      sortOrder: c.sortOrder,
      children: [],
    }));

    const byId = new Map(nodes.map((n) => [n.id, n]));
    const roots: CategoryTreeNode[] = [];

    for (const node of nodes) {
      const parent = node.parentId ? byId.get(node.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async getCategory(id: string, lang?: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null, isActive: true },
    });
    if (!category) {
      throw new NotFoundException(`Category not found: ${id}`);
    }

    const [name, attributes] = await Promise.all([
      this.resolveName('category', category.id, category.name, lang),
      this.listCategoryAttributesPublic(category.id, lang),
    ]);

    return {
      id: category.id,
      parentId: category.parentId,
      slug: category.slug,
      name,
      listingType: category.listingType,
      sortOrder: category.sortOrder,
      attributes,
    };
  }

  async listCategoryAttributesPublic(categoryId: string, lang?: string) {
    const links = await this.prisma.categoryAttribute.findMany({
      where: {
        categoryId,
        isActive: true,
        attributeDefinition: { isActive: true },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        attributeDefinition: {
          include: {
            options: {
              where: { isActive: true },
              orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
            },
          },
        },
      },
    });

    const defIds = links.map((l) => l.attributeDefinitionId);
    const optionIds = links.flatMap((l) => l.attributeDefinition.options.map((o) => o.id));
    const [defNames, optionLabels] = await Promise.all([
      this.loadTranslations('attribute_definition', defIds, lang),
      this.loadTranslations('attribute_option', optionIds, lang),
    ]);

    return links.map((link) => {
      const def = link.attributeDefinition;
      return {
        id: link.id,
        attributeDefinitionId: def.id,
        code: def.code,
        name: defNames.get(def.id) ?? def.name,
        dataType: def.dataType,
        unit: def.unit,
        isRequired: link.isRequiredOverride ?? def.isRequired,
        validationJson: def.validationJson,
        sortOrder: link.sortOrder,
        options: def.options.map((opt) => ({
          id: opt.id,
          value: opt.value,
          label: optionLabels.get(opt.id) ?? opt.label,
          sortOrder: opt.sortOrder,
        })),
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Admin — categories
  // ---------------------------------------------------------------------------

  async adminListCategories(includeInactive = true) {
    return this.prisma.category.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { children: true, attributes: true } },
      },
    });
  }

  async adminGetCategory(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        attributes: {
          orderBy: [{ sortOrder: 'asc' }],
          include: {
            attributeDefinition: {
              include: {
                options: { orderBy: [{ sortOrder: 'asc' }] },
              },
            },
          },
        },
      },
    });
    if (!category) {
      throw new NotFoundException(`Category not found: ${id}`);
    }
    const translations = await this.listAllTranslations('category', id);
    return { ...category, translations };
  }

  async createCategory(
    actorId: string,
    input: {
      slug: string;
      name: string;
      parentId?: string | null;
      listingType?: string;
      sortOrder?: number;
      isActive?: boolean;
      translations?: TranslationMap;
    },
  ) {
    if (input.parentId) {
      await this.assertCategoryExists(input.parentId);
    }

    try {
      const row = await this.prisma.category.create({
        data: {
          slug: input.slug,
          name: input.name,
          parentId: input.parentId ?? null,
          listingType: input.listingType ?? 'marketplace',
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true,
        },
      });

      if (input.translations) {
        await this.upsertTranslations('category', row.id, input.translations);
      }

      await this.audit.record({
        actorId,
        action: 'category.create',
        entityType: 'category',
        entityId: row.id,
        after: row,
      });

      return row;
    } catch (error) {
      this.rethrowUnique(error, 'Category slug already exists');
    }
  }

  async updateCategory(
    actorId: string,
    id: string,
    input: {
      slug?: string;
      name?: string;
      parentId?: string | null;
      listingType?: string;
      sortOrder?: number;
      isActive?: boolean;
      translations?: TranslationMap;
    },
  ) {
    const existing = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Category not found: ${id}`);
    }

    if (input.parentId !== undefined && input.parentId !== null) {
      if (input.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      await this.assertCategoryExists(input.parentId);
      await this.assertNoCycle(id, input.parentId);
    }

    try {
      const row = await this.prisma.category.update({
        where: { id },
        data: {
          slug: input.slug,
          name: input.name,
          parentId: input.parentId === undefined ? undefined : input.parentId,
          listingType: input.listingType,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        },
      });

      if (input.translations) {
        await this.upsertTranslations('category', row.id, input.translations);
      }

      await this.audit.record({
        actorId,
        action: 'category.update',
        entityType: 'category',
        entityId: row.id,
        before: existing,
        after: row,
      });

      return row;
    } catch (error) {
      this.rethrowUnique(error, 'Category slug already exists');
    }
  }

  async softDeleteCategory(actorId: string, id: string) {
    const existing = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Category not found: ${id}`);
    }

    const row = await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.audit.record({
      actorId,
      action: 'category.soft_delete',
      entityType: 'category',
      entityId: row.id,
      before: existing,
      after: row,
    });

    return { id: row.id, deletedAt: row.deletedAt };
  }

  // ---------------------------------------------------------------------------
  // Admin — attribute definitions & options
  // ---------------------------------------------------------------------------

  async adminListAttributes() {
    return this.prisma.attributeDefinition.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        options: { orderBy: [{ sortOrder: 'asc' }] },
        _count: { select: { categoryLinks: true } },
      },
    });
  }

  async adminGetAttribute(id: string) {
    const row = await this.prisma.attributeDefinition.findUnique({
      where: { id },
      include: {
        options: { orderBy: [{ sortOrder: 'asc' }] },
        categoryLinks: true,
      },
    });
    if (!row) {
      throw new NotFoundException(`Attribute definition not found: ${id}`);
    }
    const translations = await this.listAllTranslations('attribute_definition', id);
    return { ...row, translations };
  }

  async createAttribute(
    actorId: string,
    input: {
      code: string;
      name: string;
      dataType: string;
      unit?: string | null;
      isRequired?: boolean;
      validationJson?: Record<string, unknown> | null;
      sortOrder?: number;
      isActive?: boolean;
      translations?: TranslationMap;
      options?: Array<{ value: string; label: string; sortOrder?: number }>;
    },
  ) {
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const def = await tx.attributeDefinition.create({
          data: {
            code: input.code,
            name: input.name,
            dataType: input.dataType,
            unit: input.unit ?? null,
            isRequired: input.isRequired ?? false,
            validationJson:
              input.validationJson === undefined
                ? undefined
                : (input.validationJson as Prisma.InputJsonValue),
            sortOrder: input.sortOrder ?? 0,
            isActive: input.isActive ?? true,
          },
        });

        if (input.options?.length) {
          await tx.attributeOption.createMany({
            data: input.options.map((opt, index) => ({
              attributeDefinitionId: def.id,
              value: opt.value,
              label: opt.label,
              sortOrder: opt.sortOrder ?? index,
            })),
          });
        }

        return tx.attributeDefinition.findUniqueOrThrow({
          where: { id: def.id },
          include: { options: { orderBy: [{ sortOrder: 'asc' }] } },
        });
      });

      if (input.translations) {
        await this.upsertTranslations('attribute_definition', row.id, input.translations);
      }

      await this.audit.record({
        actorId,
        action: 'attribute.create',
        entityType: 'attribute_definition',
        entityId: row.id,
        after: row,
      });

      return row;
    } catch (error) {
      this.rethrowUnique(error, 'Attribute code already exists');
    }
  }

  async updateAttribute(
    actorId: string,
    id: string,
    input: {
      code?: string;
      name?: string;
      dataType?: string;
      unit?: string | null;
      isRequired?: boolean;
      validationJson?: Record<string, unknown> | null;
      sortOrder?: number;
      isActive?: boolean;
      translations?: TranslationMap;
    },
  ) {
    const existing = await this.prisma.attributeDefinition.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Attribute definition not found: ${id}`);
    }

    try {
      const row = await this.prisma.attributeDefinition.update({
        where: { id },
        data: {
          code: input.code,
          name: input.name,
          dataType: input.dataType,
          unit: input.unit === undefined ? undefined : input.unit,
          isRequired: input.isRequired,
          validationJson:
            input.validationJson === undefined
              ? undefined
              : (input.validationJson as Prisma.InputJsonValue),
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        },
        include: { options: { orderBy: [{ sortOrder: 'asc' }] } },
      });

      if (input.translations) {
        await this.upsertTranslations('attribute_definition', row.id, input.translations);
      }

      await this.audit.record({
        actorId,
        action: 'attribute.update',
        entityType: 'attribute_definition',
        entityId: row.id,
        before: existing,
        after: row,
      });

      return row;
    } catch (error) {
      this.rethrowUnique(error, 'Attribute code already exists');
    }
  }

  async createAttributeOption(
    actorId: string,
    attributeDefinitionId: string,
    input: {
      value: string;
      label: string;
      sortOrder?: number;
      isActive?: boolean;
      translations?: TranslationMap;
    },
  ) {
    await this.assertAttributeExists(attributeDefinitionId);

    try {
      const row = await this.prisma.attributeOption.create({
        data: {
          attributeDefinitionId,
          value: input.value,
          label: input.label,
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true,
        },
      });

      if (input.translations) {
        await this.upsertTranslations('attribute_option', row.id, input.translations, 'label');
      }

      await this.audit.record({
        actorId,
        action: 'attribute_option.create',
        entityType: 'attribute_option',
        entityId: row.id,
        after: row,
      });

      return row;
    } catch (error) {
      this.rethrowUnique(error, 'Attribute option value already exists');
    }
  }

  async updateAttributeOption(
    actorId: string,
    optionId: string,
    input: {
      value?: string;
      label?: string;
      sortOrder?: number;
      isActive?: boolean;
      translations?: TranslationMap;
    },
  ) {
    const existing = await this.prisma.attributeOption.findUnique({ where: { id: optionId } });
    if (!existing) {
      throw new NotFoundException(`Attribute option not found: ${optionId}`);
    }

    try {
      const row = await this.prisma.attributeOption.update({
        where: { id: optionId },
        data: {
          value: input.value,
          label: input.label,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        },
      });

      if (input.translations) {
        await this.upsertTranslations('attribute_option', row.id, input.translations, 'label');
      }

      await this.audit.record({
        actorId,
        action: 'attribute_option.update',
        entityType: 'attribute_option',
        entityId: row.id,
        before: existing,
        after: row,
      });

      return row;
    } catch (error) {
      this.rethrowUnique(error, 'Attribute option value already exists');
    }
  }

  // ---------------------------------------------------------------------------
  // Admin — category ↔ attribute links
  // ---------------------------------------------------------------------------

  async attachAttribute(
    actorId: string,
    categoryId: string,
    input: {
      attributeDefinitionId: string;
      isRequiredOverride?: boolean | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    await this.assertCategoryExists(categoryId);
    await this.assertAttributeExists(input.attributeDefinitionId);

    try {
      const row = await this.prisma.categoryAttribute.upsert({
        where: {
          categoryId_attributeDefinitionId: {
            categoryId,
            attributeDefinitionId: input.attributeDefinitionId,
          },
        },
        update: {
          isRequiredOverride:
            input.isRequiredOverride === undefined ? undefined : input.isRequiredOverride,
          sortOrder: input.sortOrder,
          isActive: input.isActive ?? true,
        },
        create: {
          categoryId,
          attributeDefinitionId: input.attributeDefinitionId,
          isRequiredOverride: input.isRequiredOverride ?? null,
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true,
        },
        include: { attributeDefinition: true },
      });

      await this.audit.record({
        actorId,
        action: 'category_attribute.attach',
        entityType: 'category_attribute',
        entityId: row.id,
        after: row,
      });

      return row;
    } catch (error) {
      this.rethrowUnique(error, 'Attribute already attached to category');
    }
  }

  async updateCategoryAttribute(
    actorId: string,
    linkId: string,
    input: {
      isRequiredOverride?: boolean | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.categoryAttribute.findUnique({ where: { id: linkId } });
    if (!existing) {
      throw new NotFoundException(`Category attribute link not found: ${linkId}`);
    }

    const row = await this.prisma.categoryAttribute.update({
      where: { id: linkId },
      data: {
        isRequiredOverride:
          input.isRequiredOverride === undefined ? undefined : input.isRequiredOverride,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
      include: { attributeDefinition: true },
    });

    await this.audit.record({
      actorId,
      action: 'category_attribute.update',
      entityType: 'category_attribute',
      entityId: row.id,
      before: existing,
      after: row,
    });

    return row;
  }

  async detachAttribute(actorId: string, linkId: string) {
    const existing = await this.prisma.categoryAttribute.findUnique({ where: { id: linkId } });
    if (!existing) {
      throw new NotFoundException(`Category attribute link not found: ${linkId}`);
    }

    await this.prisma.categoryAttribute.delete({ where: { id: linkId } });

    await this.audit.record({
      actorId,
      action: 'category_attribute.detach',
      entityType: 'category_attribute',
      entityId: linkId,
      before: existing,
    });

    return { id: linkId, detached: true };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async assertCategoryExists(id: string) {
    const row = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException(`Category not found: ${id}`);
    }
  }

  private async assertAttributeExists(id: string) {
    const row = await this.prisma.attributeDefinition.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException(`Attribute definition not found: ${id}`);
    }
  }

  private async assertNoCycle(categoryId: string, newParentId: string) {
    let current: string | null = newParentId;
    const visited = new Set<string>();
    while (current) {
      if (current === categoryId) {
        throw new BadRequestException('Category parent would create a cycle');
      }
      if (visited.has(current)) {
        break;
      }
      visited.add(current);
      const parent: { parentId: string | null } | null = await this.prisma.category.findFirst({
        where: { id: current, deletedAt: null },
        select: { parentId: true },
      });
      current = parent?.parentId ?? null;
    }
  }

  private async loadTranslations(
    entityType: string,
    entityIds: string[],
    languageCode?: string,
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (!languageCode || entityIds.length === 0) {
      return map;
    }
    const rows = await this.prisma.translationString.findMany({
      where: {
        entityType,
        entityId: { in: entityIds },
        languageCode,
        fieldName: 'name',
      },
    });
    for (const row of rows) {
      map.set(row.entityId, row.value);
    }
    // attribute_option translations use field_name 'label' preferentially
    if (entityType === 'attribute_option') {
      const labels = await this.prisma.translationString.findMany({
        where: {
          entityType,
          entityId: { in: entityIds },
          languageCode,
          fieldName: 'label',
        },
      });
      for (const row of labels) {
        map.set(row.entityId, row.value);
      }
    }
    return map;
  }

  private async resolveName(
    entityType: string,
    entityId: string,
    fallback: string,
    languageCode?: string,
  ) {
    if (!languageCode) {
      return fallback;
    }
    const row = await this.prisma.translationString.findUnique({
      where: {
        entityType_entityId_languageCode_fieldName: {
          entityType,
          entityId,
          languageCode,
          fieldName: 'name',
        },
      },
    });
    return row?.value ?? fallback;
  }

  private async listAllTranslations(entityType: string, entityId: string) {
    const rows = await this.prisma.translationString.findMany({
      where: { entityType, entityId },
      orderBy: [{ languageCode: 'asc' }, { fieldName: 'asc' }],
    });
    const result: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      result[row.languageCode] ??= {};
      result[row.languageCode][row.fieldName] = row.value;
    }
    return result;
  }

  private async upsertTranslations(
    entityType: string,
    entityId: string,
    translations: TranslationMap,
    fieldName = 'name',
  ) {
    for (const [languageCode, value] of Object.entries(translations)) {
      if (!value?.trim()) {
        continue;
      }
      await this.prisma.translationString.upsert({
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
  }

  private rethrowUnique(error: unknown, message: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(message);
    }
    throw error;
  }
}
