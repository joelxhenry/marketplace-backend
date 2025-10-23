import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Parish } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class SearchProvidersDto {
  @ApiPropertyOptional({
    description: 'Search query for provider name, description, or location',
    example: 'hair salon',
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({
    description: 'Filter by parish',
    enum: Parish,
    example: Parish.KINGSTON,
  })
  @IsEnum(Parish)
  @IsOptional()
  parish?: Parish;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'New Kingston',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by service category',
    example: 'Hair & Beauty',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Latitude for location-based search',
    example: 18.0179,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude for location-based search',
    example: -76.8099,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Search radius in kilometers (used with latitude/longitude)',
    example: 10,
    default: 25,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  radius?: number;

  @ApiPropertyOptional({
    description: 'Minimum average rating',
    example: 4.0,
    minimum: 0,
    maximum: 5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Maximum base price for services',
    example: 5000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Check availability for a specific date (ISO 8601 format)',
    example: '2025-10-25T10:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  availability?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

export class ProviderSearchResultDto {
  @ApiProperty({ description: 'Provider ID', example: 'clx1y2z3a0000...' })
  id: string;

  @ApiProperty({ description: 'Business name', example: 'Elite Hair Studio' })
  businessName: string;

  @ApiPropertyOptional({
    description: 'Business description',
    example: 'Premium hair salon and spa services',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Business logo URL',
    example: 'https://example.com/logo.jpg',
  })
  logo?: string;

  @ApiProperty({
    description: 'Average rating',
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  averageRating: number;

  @ApiProperty({ description: 'Number of reviews', example: 127 })
  reviewCount: number;

  @ApiProperty({ description: 'Is verified', example: true })
  isVerified: boolean;

  @ApiPropertyOptional({
    description: 'Distance from search location in kilometers',
    example: 2.45,
  })
  distance?: number;

  @ApiProperty({
    description: 'Primary location information',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', example: 'Main Branch' },
      address: { type: 'string', example: '123 Main St' },
      city: { type: 'string', example: 'Kingston' },
      parish: { type: 'string', enum: Object.values(Parish) },
      latitude: { type: 'string', example: '18.0179' },
      longitude: { type: 'string', example: '-76.8099' },
    },
  })
  primaryLocation?: {
    id: string;
    name?: string;
    address: string;
    city: string;
    parish: Parish;
    latitude: string;
    longitude: string;
  };

  @ApiProperty({
    description: 'Sample services (up to 5)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string', example: 'Classic Haircut' },
        category: { type: 'string', example: 'Hair Services' },
        basePrice: { type: 'number', example: 2500 },
        currency: { type: 'string', example: 'JMD' },
        duration: { type: 'number', example: 45 },
      },
    },
  })
  services: {
    id: string;
    name: string;
    category?: string;
    basePrice: number;
    currency: string;
    duration: number;
  }[];

  @ApiProperty({
    description: 'Featured portfolio items (up to 3)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'PHOTO' },
        imageUrl: { type: 'string', example: 'https://example.com/photo.jpg' },
        videoId: { type: 'string', nullable: true },
        title: { type: 'string', example: 'Wedding Hair' },
      },
    },
  })
  portfolioItems: {
    type: string;
    imageUrl?: string;
    videoId?: string;
    title?: string;
  }[];

  @ApiProperty({
    description: 'Team members preview (up to 3)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        avatar: { type: 'string', nullable: true },
      },
    },
  })
  teamMembers: {
    firstName: string;
    lastName: string;
    avatar?: string;
  }[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-10-01T10:00:00.000Z',
  })
  createdAt: Date;
}

export class SearchProvidersResponseDto {
  @ApiProperty({
    description: 'Search results',
    type: [ProviderSearchResultDto],
  })
  providers: ProviderSearchResultDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: 'object',
    properties: {
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 20 },
      total: { type: 'number', example: 50 },
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
