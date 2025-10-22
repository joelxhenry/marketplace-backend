import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ProviderUsersService {
  constructor(private readonly prisma: DatabaseService) {}

  async addUserToProvider(
    providerId: string,
    userId: string,
    data: {
      title?: string;
      isOwner?: boolean;
      canManageBookings?: boolean;
      canManageServices?: boolean;
      canManageLocations?: boolean;
      canViewAnalytics?: boolean;
      bio?: string;
      expertise?: string[];
    },
    requestingUserId: string,
  ) {
    // Check if requesting user has permission to add users
    const requestingProviderUser = await this.prisma.providerUser.findUnique({
      where: { providerId_userId: { providerId, userId: requestingUserId } },
    });

    if (!requestingProviderUser?.isOwner) {
      throw new ForbiddenException('Only owners can add users to provider');
    }

    // Check if user is already part of this provider
    const existingProviderUser = await this.prisma.providerUser.findUnique({
      where: { providerId_userId: { providerId, userId } },
    });

    if (existingProviderUser) {
      throw new ForbiddenException('User is already part of this provider');
    }

    return this.prisma.providerUser.create({
      data: {
        providerId,
        userId,
        ...data,
        expertise: data.expertise || [],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updateProviderUser(
    providerId: string,
    userId: string,
    data: Partial<{
      title: string;
      isActive: boolean;
      canManageBookings: boolean;
      canManageServices: boolean;
      canManageLocations: boolean;
      canViewAnalytics: boolean;
      bio: string;
      expertise: string[];
    }>,
    requestingUserId: string,
  ) {
    // Check permissions
    const requestingProviderUser = await this.prisma.providerUser.findUnique({
      where: { providerId_userId: { providerId, userId: requestingUserId } },
    });

    // Users can update their own profiles, or owners can update anyone
    if (requestingUserId !== userId && !requestingProviderUser?.isOwner) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const providerUser = await this.prisma.providerUser.findUnique({
      where: { providerId_userId: { providerId, userId } },
    });

    if (!providerUser) {
      throw new NotFoundException('Provider user not found');
    }

    return this.prisma.providerUser.update({
      where: { providerId_userId: { providerId, userId } },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async removeUserFromProvider(
    providerId: string,
    userId: string,
    requestingUserId: string,
  ) {
    // Check if requesting user has permission
    const requestingProviderUser = await this.prisma.providerUser.findUnique({
      where: { providerId_userId: { providerId, userId: requestingUserId } },
    });

    if (!requestingProviderUser?.isOwner && requestingUserId !== userId) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Don't allow removing the last owner
    if (requestingUserId === userId) {
      const ownerCount = await this.prisma.providerUser.count({
        where: { providerId, isOwner: true },
      });

      const userToRemove = await this.prisma.providerUser.findUnique({
        where: { providerId_userId: { providerId, userId } },
      });

      if (userToRemove?.isOwner && ownerCount <= 1) {
        throw new ForbiddenException('Cannot remove the last owner');
      }
    }

    return this.prisma.providerUser.delete({
      where: { providerId_userId: { providerId, userId } },
    });
  }

  async getProviderUsers(providerId: string) {
    return this.prisma.providerUser.findMany({
      where: { providerId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { isOwner: 'desc' },
        { joinedAt: 'asc' },
      ],
    });
  }

  async getUserProviders(userId: string) {
    return this.prisma.providerUser.findMany({
      where: { userId, isActive: true },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
            isVerified: true,
            subscriptionPlan: true,
          },
        },
      },
    });
  }
}
