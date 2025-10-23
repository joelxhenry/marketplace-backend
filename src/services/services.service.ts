import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Create a new service for a provider
   */
  async create(providerId: string, createServiceDto: CreateServiceDto, userId: string) {
    // Check if user has permission to manage services for this provider
    const providerUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId,
        userId,
        isActive: true,
      },
    });

    if (!providerUser || (!providerUser.isOwner && !providerUser.canManageServices)) {
      throw new ForbiddenException('You do not have permission to manage services for this provider');
    }

    // Create the service
    return this.prisma.service.create({
      data: {
        ...createServiceDto,
        providerId,
      },
    });
  }

  /**
   * Get all services with pagination and optional filters
   */
  async findAll(paginationDto: PaginationDto, filters?: { category?: string; isActive?: boolean }) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          provider: {
            select: {
              id: true,
              businessName: true,
              logoUrl: true,
              isVerified: true,
              averageRating: true,
            },
          },
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: services,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get services for a specific provider
   */
  async findByProvider(providerId: string) {
    return this.prisma.service.findMany({
      where: { providerId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get service by ID
   */
  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
            bannerUrl: true,
            isVerified: true,
            averageRating: true,
            reviewCount: true,
          },
        },
        addOns: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  /**
   * Update service
   */
  async update(id: string, updateServiceDto: UpdateServiceDto, userId: string) {
    // Find the service
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Check if user has permission to manage services for this provider
    const providerUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId: service.providerId,
        userId,
        isActive: true,
      },
    });

    if (!providerUser || (!providerUser.isOwner && !providerUser.canManageServices)) {
      throw new ForbiddenException('You do not have permission to manage services for this provider');
    }

    // Update the service
    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  /**
   * Delete service
   */
  async remove(id: string, userId: string) {
    // Find the service
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Check if user has permission to manage services for this provider
    const providerUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId: service.providerId,
        userId,
        isActive: true,
      },
    });

    if (!providerUser || (!providerUser.isOwner && !providerUser.canManageServices)) {
      throw new ForbiddenException('You do not have permission to manage services for this provider');
    }

    // Delete the service
    await this.prisma.service.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Service "${service.name}" has been deleted`,
    };
  }
}
