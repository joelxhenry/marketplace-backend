import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
  IsDecimal,
} from 'class-validator';
import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';

// Create Service DTO
export class CreateServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Classic Haircut',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Service description',
    example: 'Professional haircut with styling and finishing',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Service category',
    example: 'Hair',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({
    description: 'Service subcategory',
    example: 'Cuts',
  })
  @IsString()
  @IsOptional()
  subCategory?: string;

  @ApiProperty({
    description: 'Base price',
    example: 2500.00,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  basePrice: number;

  @ApiPropertyOptional({
    description: 'Currency',
    enum: Currency,
    example: Currency.JMD,
    default: Currency.JMD,
  })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 45,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  duration: number;

  @ApiPropertyOptional({
    description: 'Requires approval before booking',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum days in advance for booking',
    example: 30,
    default: 30,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  advanceBookingDays?: number;
}

// Update Service DTO
export class UpdateServiceDto {
  @ApiPropertyOptional({
    description: 'Service name',
    example: 'Classic Haircut',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'Professional haircut with styling and finishing',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Service category',
    example: 'Hair',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Service subcategory',
    example: 'Cuts',
  })
  @IsString()
  @IsOptional()
  subCategory?: string;

  @ApiPropertyOptional({
    description: 'Base price',
    example: 2500.00,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  basePrice?: number;

  @ApiPropertyOptional({
    description: 'Currency',
    enum: Currency,
    example: Currency.JMD,
  })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @ApiPropertyOptional({
    description: 'Service duration in minutes',
    example: 45,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({
    description: 'Active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Requires approval before booking',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum days in advance for booking',
    example: 30,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  advanceBookingDays?: number;
}

// Service Response DTO
export class ServiceResponseDto {
  @ApiProperty({
    description: 'Service ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  id: string;

  @ApiProperty({
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  providerId: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Classic Haircut',
  })
  name: string;

  @ApiProperty({
    description: 'Service description',
    example: 'Professional haircut with styling and finishing',
  })
  description: string;

  @ApiProperty({
    description: 'Service category',
    example: 'Hair',
  })
  category: string;

  @ApiPropertyOptional({
    description: 'Service subcategory',
    example: 'Cuts',
  })
  subCategory?: string;

  @ApiProperty({
    description: 'Base price',
    example: 2500.00,
  })
  basePrice: number;

  @ApiProperty({
    description: 'Currency',
    enum: Currency,
    example: Currency.JMD,
  })
  currency: Currency;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 45,
  })
  duration: number;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Requires approval',
    example: false,
  })
  requiresApproval: boolean;

  @ApiProperty({
    description: 'Advance booking days',
    example: 30,
  })
  advanceBookingDays: number;

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

// Service with Provider Response DTO
export class ServiceWithProviderResponseDto extends ServiceResponseDto {
  @ApiProperty({
    description: 'Provider information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'clx1y2z3a4b5c6d7e8f9g0h1' },
      businessName: { type: 'string', example: 'Elite Cleaning Services' },
      logoUrl: { type: 'string', example: 'https://example.com/logo.png' },
      isVerified: { type: 'boolean', example: true },
      averageRating: { type: 'number', example: 4.7 },
    },
  })
  provider: {
    id: string;
    businessName: string;
    logoUrl?: string;
    isVerified: boolean;
    averageRating: number;
  };
}
