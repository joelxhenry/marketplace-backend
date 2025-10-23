import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProviderDto, UpdateProviderDto, AddTeamMemberDto } from './dto/provider.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Create a new provider and assign the creator as owner
   */
  async create(createProviderDto: CreateProviderDto, userId: string) {
    // Create provider with the creator as the first team member (owner)
    const provider = await this.prisma.provider.create({
      data: {
        ...createProviderDto,
        providerUsers: {
          create: {
            userId,
            isOwner: true,
            title: 'Owner',
            canManageBookings: true,
            canManageServices: true,
            canManageLocations: true,
            canViewAnalytics: true,
          },
        },
      },
      include: {
        providerUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return provider;
  }

  /**
   * Get all providers with filtering and pagination
   */
  async findAll(paginationDto: PaginationDto, filters?: { isVerified?: boolean; isActive?: boolean }) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [providers, total] = await Promise.all([
      this.prisma.provider.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          businessName: true,
          description: true,
          logoUrl: true,
          bannerUrl: true,
          businessPhone: true,
          businessEmail: true,
          whatsapp: true,
          website: true,
          isVerified: true,
          isActive: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          averageRating: true,
          reviewCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.provider.count({ where }),
    ]);

    return {
      data: providers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get providers for the current user
   */
  async findMyProviders(userId: string) {
    const providerUsers = await this.prisma.providerUser.findMany({
      where: { userId },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            description: true,
            logoUrl: true,
            bannerUrl: true,
            businessPhone: true,
            businessEmail: true,
            isVerified: true,
            isActive: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            averageRating: true,
            reviewCount: true,
          },
        },
      },
    });

    return providerUsers.map(pu => ({
      ...pu.provider,
      userRole: {
        title: pu.title,
        isOwner: pu.isOwner,
        canManageBookings: pu.canManageBookings,
        canManageServices: pu.canManageServices,
        canManageLocations: pu.canManageLocations,
        canViewAnalytics: pu.canViewAnalytics,
      },
    }));
  }

  /**
   * Get provider by ID
   */
  async findOne(id: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        providerUsers: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        providerLocations: {
          where: { isActive: true },
        },
        services: true,
      },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    return provider;
  }

  /**
   * Update provider (owners and authorized team members only)
   */
  async update(id: string, updateProviderDto: UpdateProviderDto, userId: string) {
    // Check if provider exists
    const provider = await this.prisma.provider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    // Check if user has permission to update
    const providerUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId: id,
        userId,
        isActive: true,
      },
    });

    if (!providerUser || (!providerUser.isOwner && !providerUser.canManageServices)) {
      throw new ForbiddenException('You do not have permission to update this provider');
    }

    // Update provider
    const updatedProvider = await this.prisma.provider.update({
      where: { id },
      data: updateProviderDto,
    });

    return updatedProvider;
  }

  /**
   * Delete provider (Admin only)
   */
  async remove(id: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    await this.prisma.provider.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Provider "${provider.businessName}" has been deleted`,
    };
  }

  /**
   * Add team member to provider
   */
  async addTeamMember(providerId: string, addTeamMemberDto: AddTeamMemberDto, requestingUserId: string) {
    // Check if provider exists
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${providerId} not found`);
    }

    // Check if requesting user is owner
    const requestingProviderUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId,
        userId: requestingUserId,
        isOwner: true,
        isActive: true,
      },
    });

    if (!requestingProviderUser) {
      throw new ForbiddenException('Only owners can add team members');
    }

    // Check if user already exists in the team
    const existingMember = await this.prisma.providerUser.findFirst({
      where: {
        providerId,
        userId: addTeamMemberDto.userId,
      },
    });

    if (existingMember) {
      if (existingMember.isActive) {
        throw new ConflictException('User is already a member of this provider');
      } else {
        // Reactivate the member
        const reactivated = await this.prisma.providerUser.update({
          where: { id: existingMember.id },
          data: {
            isActive: true,
            ...addTeamMemberDto,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        });
        return reactivated;
      }
    }

    // Add new team member
    const teamMember = await this.prisma.providerUser.create({
      data: {
        providerId,
        ...addTeamMemberDto,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return teamMember;
  }

  /**
   * Get team members for a provider
   */
  async getTeamMembers(providerId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${providerId} not found`);
    }

    const teamMembers = await this.prisma.providerUser.findMany({
      where: {
        providerId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ isOwner: 'desc' }, { joinedAt: 'asc' }],
    });

    return teamMembers;
  }

  /**
   * Remove team member from provider
   */
  async removeTeamMember(providerId: string, userId: string, requestingUserId: string) {
    // Check if requesting user is owner
    const requestingProviderUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId,
        userId: requestingUserId,
        isOwner: true,
        isActive: true,
      },
    });

    if (!requestingProviderUser) {
      throw new ForbiddenException('Only owners can remove team members');
    }

    // Find the team member to remove
    const teamMember = await this.prisma.providerUser.findFirst({
      where: {
        providerId,
        userId,
      },
    });

    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    // Prevent removing the last owner
    if (teamMember.isOwner) {
      const ownerCount = await this.prisma.providerUser.count({
        where: {
          providerId,
          isOwner: true,
          isActive: true,
        },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot remove the last owner of the provider');
      }
    }

    // Soft delete by setting isActive to false
    await this.prisma.providerUser.update({
      where: { id: teamMember.id },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Team member removed successfully',
    };
  }
}
