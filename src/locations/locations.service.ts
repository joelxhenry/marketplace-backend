import { Injectable } from '@nestjs/common';
import { Parish } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: DatabaseService) {}

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
