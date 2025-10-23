import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { Parish } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreateLocationDto, UpdateLocationDto, AddLocationToProviderDto, UpdateProviderLocationDto } from './dto/location.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Create a new location
   */
  async create(createLocationDto: CreateLocationDto) {
    return this.prisma.location.create({
      data: createLocationDto,
    });
  }

  /**
   * Get all locations with pagination
   */
  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [locations, total] = await Promise.all([
      this.prisma.location.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.location.count(),
    ]);

    return {
      data: locations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get location by ID
   */
  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        providerLocations: {
          where: { isActive: true },
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
        },
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return location;
  }

  /**
   * Update location
   */
  async update(id: string, updateLocationDto: UpdateLocationDto) {
    const location = await this.prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return this.prisma.location.update({
      where: { id },
      data: updateLocationDto,
    });
  }

  /**
   * Delete location (Admin only - cascade will handle relationships)
   */
  async remove(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    await this.prisma.location.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Location "${location.name}" has been deleted`,
    };
  }

  /**
   * Add existing location to provider
   */
  async addLocationToProvider(
    providerId: string,
    addLocationDto: AddLocationToProviderDto,
    userId: string,
  ) {
    // Check if provider exists and user has permission
    const providerUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId,
        userId,
        isActive: true,
      },
    });

    if (!providerUser || (!providerUser.isOwner && !providerUser.canManageLocations)) {
      throw new ForbiddenException('You do not have permission to manage locations for this provider');
    }

    // Check if location exists
    const location = await this.prisma.location.findUnique({
      where: { id: addLocationDto.locationId },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${addLocationDto.locationId} not found`);
    }

    // Check if already linked
    const existing = await this.prisma.providerLocation.findFirst({
      where: {
        providerId,
        locationId: addLocationDto.locationId,
      },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Location is already linked to this provider');
      } else {
        // Reactivate
        return this.prisma.providerLocation.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            isPrimary: addLocationDto.isPrimary || false,
          },
          include: {
            location: true,
          },
        });
      }
    }

    // If setting as primary, unset other primary locations
    if (addLocationDto.isPrimary) {
      await this.prisma.providerLocation.updateMany({
        where: { providerId },
        data: { isPrimary: false },
      });
    }

    // Create the link
    return this.prisma.providerLocation.create({
      data: {
        providerId,
        locationId: addLocationDto.locationId,
        isPrimary: addLocationDto.isPrimary || false,
      },
      include: {
        location: true,
      },
    });
  }

  /**
   * Update provider location settings
   */
  async updateProviderLocation(
    providerId: string,
    locationId: string,
    updateDto: UpdateProviderLocationDto,
    userId: string,
  ) {
    // Check permission
    const providerUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId,
        userId,
        isActive: true,
      },
    });

    if (!providerUser || (!providerUser.isOwner && !providerUser.canManageLocations)) {
      throw new ForbiddenException('You do not have permission to manage locations for this provider');
    }

    // Find the provider location
    const providerLocation = await this.prisma.providerLocation.findFirst({
      where: {
        providerId,
        locationId,
      },
    });

    if (!providerLocation) {
      throw new NotFoundException('Provider location not found');
    }

    // If setting as primary, unset other primary locations
    if (updateDto.isPrimary) {
      await this.prisma.providerLocation.updateMany({
        where: {
          providerId,
          id: { not: providerLocation.id },
        },
        data: { isPrimary: false },
      });
    }

    // Update the provider location
    return this.prisma.providerLocation.update({
      where: { id: providerLocation.id },
      data: updateDto,
      include: {
        location: true,
      },
    });
  }

  /**
   * Remove location from provider
   */
  async removeLocationFromProvider(providerId: string, locationId: string, userId: string) {
    // Check permission
    const providerUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId,
        userId,
        isActive: true,
      },
    });

    if (!providerUser || (!providerUser.isOwner && !providerUser.canManageLocations)) {
      throw new ForbiddenException('You do not have permission to manage locations for this provider');
    }

    // Find the provider location
    const providerLocation = await this.prisma.providerLocation.findFirst({
      where: {
        providerId,
        locationId,
      },
    });

    if (!providerLocation) {
      throw new NotFoundException('Provider location not found');
    }

    // Soft delete by setting isActive to false
    await this.prisma.providerLocation.update({
      where: { id: providerLocation.id },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Location removed from provider successfully',
    };
  }

  async createLocation(data: {
    name: string;
    address: string;
    city?: string;
    parish?: Parish;
    state?: string;
    country?: string;
    latitude: number;
    longitude: number;
    zipCode?: string;
    timezone?: string;
  }) {
    return this.prisma.location.create({
      data: {
        ...data,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  }

  async findNearbyLocations(
    latitude: number,
    longitude: number,
    radiusKm: number = 25,
  ) {
    const radiusMeters = radiusKm * 1000;

    // Use PostgreSQL with PostGIS for precise geospatial queries
    const locations = await this.prisma.$queryRaw`
      SELECT
        l.*,
        ST_Distance(
          ST_MakePoint(CAST(l.longitude AS float), CAST(l.latitude AS float))::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography
        ) / 1000 as distance_km
      FROM "locations" l
      WHERE ST_DWithin(
        ST_MakePoint(CAST(l.longitude AS float), CAST(l.latitude AS float))::geography,
        ST_MakePoint(${longitude}, ${latitude})::geography,
        ${radiusMeters}
      )
      ORDER BY distance_km ASC
      LIMIT 50
    `;

    return locations;
  }

  async getProviderLocations(providerId: string) {
    return this.prisma.providerLocation.findMany({
      where: { providerId, isActive: true },
      include: {
        location: true,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async addProviderLocation(
    providerId: string,
    locationData: {
      name: string;
      address: string;
      city?: string;
      parish?: Parish;
      latitude: number;
      longitude: number;
      isPrimary?: boolean;
    },
  ) {
    // Create location first
    const location = await this.createLocation({
      ...locationData,
      country: 'Jamaica',
    });

    // If this is set as primary, unset other primary locations
    if (locationData.isPrimary) {
      await this.prisma.providerLocation.updateMany({
        where: { providerId },
        data: { isPrimary: false },
      });
    }

    // Link to provider
    return this.prisma.providerLocation.create({
      data: {
        providerId,
        locationId: location.id,
        isPrimary: locationData.isPrimary || false,
      },
      include: {
        location: true,
      },
    });
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
