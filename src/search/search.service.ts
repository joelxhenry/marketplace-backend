import { Injectable } from '@nestjs/common';
import { Parish, PortfolioItemType } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: DatabaseService) {}

  async searchProviders(filters: {
    query?: string;
    parish?: Parish;
    city?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    radius?: number; // in kilometers
    minRating?: number;
    maxPrice?: number;
    availability?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      query,
      parish,
      city,
      category,
      latitude,
      longitude,
      radius = 25,
      minRating,
      maxPrice,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    // Build search conditions
    const where: any = {
      isActive: true,
      isVerified: true,
    };

    // Text search
    if (query) {
      where.OR = [
        { businessName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        {
          providerLocations: {
            some: {
              location: {
                OR: [
                  { city: { contains: query, mode: 'insensitive' } },
                  { name: { contains: query, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
      ];
    }

    // Location filters - search through provider locations
    if (parish || city) {
      where.providerLocations = {
        some: {
          isActive: true,
          location: {
            ...(parish && { parish }),
            ...(city && { city: { contains: city, mode: 'insensitive' } }),
          },
        },
      };
    }

    // Rating filter
    if (minRating) {
      where.averageRating = { gte: minRating };
    }

    // Service category filter
    if (category) {
      where.services = {
        some: {
          category: { contains: category, mode: 'insensitive' },
          isActive: true,
        },
      };
    }

    // Price filter
    if (maxPrice) {
      where.services = {
        some: {
          ...where.services?.some,
          basePrice: { lte: maxPrice },
        },
      };
    }

    let providers;

    // Location-based search using multiple provider locations
    if (latitude && longitude) {
      providers = await this.searchByLocation(
        latitude,
        longitude,
        radius,
        where,
        skip,
        limit,
      );
    } else {
      // Regular search
      providers = await this.prisma.provider.findMany({
        where,
        include: {
          providerUsers: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            take: 3, // Show first 3 team members
          },
          providerLocations: {
            where: { isActive: true },
            include: {
              location: true,
            },
            orderBy: { isPrimary: 'desc' },
            take: 1, // Primary location for listing
          },
          services: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              category: true,
              basePrice: true,
              currency: true,
              duration: true,
            },
            take: 5,
          },
          portfolioItems: {
            where: { isFeatured: true },
            take: 3,
            select: {
              type: true,
              imageUrl: true,
              videoId: true,
              title: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { averageRating: 'desc' },
          { reviewCount: 'desc' },
          { createdAt: 'desc' },
        ],
      });
    }

    // Add distance for location-based results
    if (latitude && longitude) {
      providers = providers.map(provider => {
        const primaryLocation = provider.providerLocations[0]?.location;
        return {
          ...provider,
          distance: primaryLocation ? this.calculateDistance(
            latitude,
            longitude,
            Number(primaryLocation.latitude),
            Number(primaryLocation.longitude),
          ) : null,
        };
      });
    }

    return {
      providers,
      pagination: {
        page,
        limit,
        total: providers.length,
      },
    };
  }

  private async searchByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    additionalWhere: any,
    skip: number,
    limit: number,
  ) {
    const radiusMeters = radiusKm * 1000;

    // Search providers with locations within radius
    const providers = await this.prisma.$queryRaw`
      SELECT DISTINCT
        p.*,
        MIN(ST_Distance(
          ST_MakePoint(CAST(l.longitude AS float), CAST(l.latitude AS float))::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography
        ) / 1000) as distance_km
      FROM "providers" p
      JOIN "provider_locations" pl ON p.id = pl."providerId"
      JOIN "locations" l ON pl."locationId" = l.id
      WHERE p."isActive" = true
        AND p."isVerified" = true
        AND pl."isActive" = true
        AND ST_DWithin(
          ST_MakePoint(CAST(l.longitude AS float), CAST(l.latitude AS float))::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography,
          ${radiusMeters}
        )
      GROUP BY p.id
      ORDER BY distance_km ASC, p."averageRating" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    // Get full provider data for the results
    const providerIds = (providers as any[]).map(p => p.id);

    return this.prisma.provider.findMany({
      where: { id: { in: providerIds } },
      include: {
        providerUsers: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          take: 3,
        },
        providerLocations: {
          where: { isActive: true },
          include: {
            location: true,
          },
          orderBy: { isPrimary: 'desc' },
        },
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            category: true,
            basePrice: true,
            currency: true,
            duration: true,
          },
          take: 5,
        },
        portfolioItems: {
          where: { isFeatured: true },
          take: 3,
          select: {
            type: true,
            imageUrl: true,
            videoId: true,
            title: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });
  }

  private calculateDistance(
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

    return Math.round(distance * 100) / 100;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
