import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsDecimal,
} from 'class-validator';
import { Parish } from '@prisma/client';
import { Type } from 'class-transformer';

// Create Location DTO
export class CreateLocationDto {
  @ApiProperty({
    description: 'Location name/identifier',
    example: 'Kingston Downtown Office',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 King Street',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Kingston',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Parish (for Jamaica)',
    enum: Parish,
    example: Parish.KINGSTON,
  })
  @IsEnum(Parish)
  @IsOptional()
  parish?: Parish;

  @ApiPropertyOptional({
    description: 'State (for other countries)',
    example: 'California',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'Jamaica',
    default: 'Jamaica',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 18.0179,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -76.8099,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsNotEmpty()
  longitude: number;

  @ApiPropertyOptional({
    description: 'ZIP/Postal code',
    example: 'JMAKN01',
  })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'America/Jamaica',
    default: 'America/Jamaica',
  })
  @IsString()
  @IsOptional()
  timezone?: string;
}

// Update Location DTO
export class UpdateLocationDto {
  @ApiPropertyOptional({
    description: 'Location name/identifier',
    example: 'Kingston Downtown Office',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Street address',
    example: '123 King Street',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Kingston',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Parish (for Jamaica)',
    enum: Parish,
    example: Parish.KINGSTON,
  })
  @IsEnum(Parish)
  @IsOptional()
  parish?: Parish;

  @ApiPropertyOptional({
    description: 'State (for other countries)',
    example: 'California',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'Jamaica',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
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
    description: 'Longitude coordinate',
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
    description: 'ZIP/Postal code',
    example: 'JMAKN01',
  })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'America/Jamaica',
  })
  @IsString()
  @IsOptional()
  timezone?: string;
}

// Location Response DTO
export class LocationResponseDto {
  @ApiProperty({
    description: 'Location ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  id: string;

  @ApiProperty({
    description: 'Location name',
    example: 'Kingston Downtown Office',
  })
  name: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 King Street',
  })
  address: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Kingston',
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'Parish',
    enum: Parish,
    example: Parish.KINGSTON,
  })
  parish?: Parish;

  @ApiPropertyOptional({
    description: 'State',
    example: 'California',
  })
  state?: string;

  @ApiProperty({
    description: 'Country',
    example: 'Jamaica',
  })
  country: string;

  @ApiProperty({
    description: 'Latitude',
    example: 18.0179,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude',
    example: -76.8099,
  })
  longitude: number;

  @ApiPropertyOptional({
    description: 'ZIP code',
    example: 'JMAKN01',
  })
  zipCode?: string;

  @ApiProperty({
    description: 'Timezone',
    example: 'America/Jamaica',
  })
  timezone: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-01-20T14:30:00.000Z',
  })
  updatedAt: Date;
}

// Add Location to Provider DTO
export class AddLocationToProviderDto {
  @ApiProperty({
    description: 'Location ID to add',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ApiPropertyOptional({
    description: 'Set as primary location',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

// Update Provider Location DTO
export class UpdateProviderLocationDto {
  @ApiPropertyOptional({
    description: 'Set as primary location',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// Provider Location Response DTO
export class ProviderLocationResponseDto {
  @ApiProperty({
    description: 'ProviderLocation ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  id: string;

  @ApiProperty({
    description: 'Location details',
    type: LocationResponseDto,
  })
  location: LocationResponseDto;

  @ApiProperty({
    description: 'Is primary location',
    example: true,
  })
  isPrimary: boolean;

  @ApiProperty({
    description: 'Is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}

// Search Nearby Locations DTO
export class SearchNearbyDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 18.0179,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -76.8099,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiPropertyOptional({
    description: 'Search radius in kilometers',
    example: 5,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  radius?: number;
}
