import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from './audit.service';

@Injectable()
export class RbacService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listRoles() {
    const roles = await this.prisma.role.findMany({
      orderBy: { code: 'asc' },
      include: {
        permissions: {
          include: { permission: true },
          orderBy: { permission: { code: 'asc' } },
        },
        _count: { select: { assignments: true } },
      },
    });

    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      assignmentCount: role._count.assignments,
      permissions: role.permissions.map((rp) => ({
        code: rp.permission.code,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
    }));
  }

  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
      },
    });
  }

  async listUsers(input?: { q?: string; page?: number; pageSize?: number; roleCode?: string }) {
    const page = Math.max(input?.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input?.pageSize ?? 20, 1), 100);
    const q = input?.q?.trim();

    const where = {
      deletedAt: null,
      ...(input?.roleCode ? { roleAssignments: { some: { role: { code: input.roleCode } } } } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' as const } },
              { displayName: { contains: q, mode: 'insensitive' as const } },
              { phoneE164: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          phoneE164: true,
          displayName: true,
          accountType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          roleAssignments: {
            include: { role: { select: { code: true, name: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      items: rows.map((user) => ({
        id: user.id,
        email: user.email,
        phoneE164: user.phoneE164,
        displayName: user.displayName,
        accountType: user.accountType,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.roleAssignments.map((a) => ({
          code: a.role.code,
          name: a.role.name,
          assignedAt: a.createdAt,
        })),
      })),
    };
  }

  async getUserRoles(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        roleAssignments: {
          include: { role: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      userId: user.id,
      email: user.email,
      roles: user.roleAssignments.map((a) => ({
        code: a.role.code,
        name: a.role.name,
        assignedAt: a.createdAt,
      })),
    };
  }

  async assignRole(actorId: string, userId: string, roleCode: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) {
      throw new BadRequestException(`Unknown role: ${roleCode}`);
    }

    const assignment = await this.prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
      include: { role: true },
    });

    await this.audit.record({
      actorId,
      action: 'rbac.role.assign',
      entityType: 'user',
      entityId: userId,
      after: { roleCode: role.code, assignmentId: assignment.id },
    });

    return {
      userId,
      role: { code: assignment.role.code, name: assignment.role.name },
      assignedAt: assignment.createdAt,
    };
  }

  async revokeRole(actorId: string, userId: string, roleCode: string) {
    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) {
      throw new BadRequestException(`Unknown role: ${roleCode}`);
    }

    const existing = await this.prisma.userRoleAssignment.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (!existing) {
      throw new NotFoundException('Role assignment not found');
    }

    await this.prisma.userRoleAssignment.delete({
      where: { id: existing.id },
    });

    await this.audit.record({
      actorId,
      action: 'rbac.role.revoke',
      entityType: 'user',
      entityId: userId,
      before: { roleCode: role.code, assignmentId: existing.id },
    });

    return { userId, roleCode: role.code, revoked: true };
  }
}
