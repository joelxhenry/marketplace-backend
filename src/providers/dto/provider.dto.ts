import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  IsUrl,
} from 'class-validator';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

// Create Provider DTO
export class CreateProviderDto {
  @ApiProperty({
    description: 'Business name',
    example: 'Elite Cleaning Services',
  })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({
    description: 'Business description',
    example: 'Professional cleaning services for homes and offices in Kingston',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Business phone number',
    example: '+1876-555-0100',
  })
  @IsString()
  @IsNotEmpty()
  businessPhone: string;

  @ApiProperty({
    description: 'Business email address',
    example: 'contact@elitecleaning.com',
  })
  @IsEmail()
  @IsNotEmpty()
  businessEmail: string;

  @ApiPropertyOptional({
    description: 'WhatsApp number',
    example: '+1876-555-0100',
  })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional({
    description: 'Business website URL',
    example: 'https://elitecleaning.com',
  })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://example.com/logos/elite-cleaning.png',
  })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Banner image URL',
    example: 'https://example.com/banners/elite-cleaning.jpg',
  })
  @IsUrl()
  @IsOptional()
  bannerUrl?: string;

  @ApiPropertyOptional({
    description: 'Business registration number',
    example: 'BR-2024-001234',
  })
  @IsString()
  @IsOptional()
  businessRegNo?: string;

  @ApiPropertyOptional({
    description: 'Tax registration number (TRN)',
    example: '123-456-789',
  })
  @IsString()
  @IsOptional()
  taxRegNo?: string;

  @ApiPropertyOptional({
    description: 'Auto-accept bookings',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  autoAcceptBookings?: boolean;

  @ApiPropertyOptional({
    description: 'Booking buffer time in minutes',
    example: 15,
    default: 15,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  bookingBufferMins?: number;

  @ApiPropertyOptional({
    description: 'Cancellation policy text',
    example: 'Cancellations must be made 24 hours in advance for a full refund.',
  })
  @IsString()
  @IsOptional()
  cancellationPolicy?: string;
}

// Update Provider DTO
export class UpdateProviderDto {
  @ApiPropertyOptional({
    description: 'Business name',
    example: 'Elite Cleaning Services',
  })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Business description',
    example: 'Professional cleaning services for homes and offices',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Business phone number',
    example: '+1876-555-0100',
  })
  @IsString()
  @IsOptional()
  businessPhone?: string;

  @ApiPropertyOptional({
    description: 'Business email address',
    example: 'contact@elitecleaning.com',
  })
  @IsEmail()
  @IsOptional()
  businessEmail?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp number',
    example: '+1876-555-0100',
  })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional({
    description: 'Business website URL',
    example: 'https://elitecleaning.com',
  })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://example.com/logos/elite-cleaning.png',
  })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Banner image URL',
    example: 'https://example.com/banners/elite-cleaning.jpg',
  })
  @IsUrl()
  @IsOptional()
  bannerUrl?: string;

  @ApiPropertyOptional({
    description: 'Business registration number',
    example: 'BR-2024-001234',
  })
  @IsString()
  @IsOptional()
  businessRegNo?: string;

  @ApiPropertyOptional({
    description: 'Tax registration number (TRN)',
    example: '123-456-789',
  })
  @IsString()
  @IsOptional()
  taxRegNo?: string;

  @ApiPropertyOptional({
    description: 'Auto-accept bookings',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  autoAcceptBookings?: boolean;

  @ApiPropertyOptional({
    description: 'Booking buffer time in minutes',
    example: 15,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  bookingBufferMins?: number;

  @ApiPropertyOptional({
    description: 'Cancellation policy text',
    example: 'Cancellations must be made 24 hours in advance for a full refund.',
  })
  @IsString()
  @IsOptional()
  cancellationPolicy?: string;

  @ApiPropertyOptional({
    description: 'Active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// Provider Response DTO
export class ProviderResponseDto {
  @ApiProperty({
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  id: string;

  @ApiProperty({
    description: 'Business name',
    example: 'Elite Cleaning Services',
  })
  businessName: string;

  @ApiProperty({
    description: 'Business description',
    example: 'Professional cleaning services for homes and offices in Kingston',
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://example.com/logos/elite-cleaning.png',
  })
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Banner image URL',
    example: 'https://example.com/banners/elite-cleaning.jpg',
  })
  bannerUrl?: string;

  @ApiProperty({
    description: 'Business phone number',
    example: '+1876-555-0100',
  })
  businessPhone: string;

  @ApiProperty({
    description: 'Business email address',
    example: 'contact@elitecleaning.com',
  })
  businessEmail: string;

  @ApiPropertyOptional({
    description: 'WhatsApp number',
    example: '+1876-555-0100',
  })
  whatsapp?: string;

  @ApiPropertyOptional({
    description: 'Business website URL',
    example: 'https://elitecleaning.com',
  })
  website?: string;

  @ApiPropertyOptional({
    description: 'Business registration number',
    example: 'BR-2024-001234',
  })
  businessRegNo?: string;

  @ApiPropertyOptional({
    description: 'Tax registration number',
    example: '123-456-789',
  })
  taxRegNo?: string;

  @ApiProperty({
    description: 'Verification status',
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Verification timestamp',
    example: '2025-01-20T10:30:00.000Z',
  })
  verifiedAt?: Date;

  @ApiProperty({
    description: 'Auto-accept bookings setting',
    example: false,
  })
  autoAcceptBookings: boolean;

  @ApiProperty({
    description: 'Booking buffer time in minutes',
    example: 15,
  })
  bookingBufferMins: number;

  @ApiPropertyOptional({
    description: 'Cancellation policy',
    example: 'Cancellations must be made 24 hours in advance for a full refund.',
  })
  cancellationPolicy?: string;

  @ApiProperty({
    description: 'Subscription plan',
    enum: SubscriptionPlan,
    example: SubscriptionPlan.BASIC,
  })
  subscriptionPlan: SubscriptionPlan;

  @ApiProperty({
    description: 'Subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  subscriptionStatus: SubscriptionStatus;

  @ApiPropertyOptional({
    description: 'Plan expiration date',
    example: '2025-12-31T23:59:59.000Z',
  })
  planExpiresAt?: Date;

  @ApiProperty({
    description: 'Average rating',
    example: 4.7,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Total review count',
    example: 127,
  })
  reviewCount: number;

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

// Add Team Member DTO
export class AddTeamMemberDto {
  @ApiProperty({
    description: 'User ID to add to the provider team',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'Job title/role in the business',
    example: 'Senior Barber',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Whether this user is an owner',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isOwner?: boolean;

  @ApiPropertyOptional({
    description: 'Can manage bookings',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  canManageBookings?: boolean;

  @ApiPropertyOptional({
    description: 'Can manage services',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  canManageServices?: boolean;

  @ApiPropertyOptional({
    description: 'Can manage locations',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  canManageLocations?: boolean;

  @ApiPropertyOptional({
    description: 'Can view analytics',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  canViewAnalytics?: boolean;

  @ApiPropertyOptional({
    description: 'Bio/description',
    example: 'Experienced barber with 10+ years in the industry',
  })
  @IsString()
  @IsOptional()
  bio?: string;
}

// Team Member Response DTO
export class TeamMemberResponseDto {
  @ApiProperty({
    description: 'ProviderUser ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  id: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'clx1y2z3a4b5c6d7e8f9g0h1' },
      email: { type: 'string', example: 'john.doe@example.com' },
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
      avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
    },
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };

  @ApiPropertyOptional({
    description: 'Job title',
    example: 'Senior Barber',
  })
  title?: string;

  @ApiProperty({
    description: 'Is owner',
    example: false,
  })
  isOwner: boolean;

  @ApiProperty({
    description: 'Is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Can manage bookings',
    example: true,
  })
  canManageBookings: boolean;

  @ApiProperty({
    description: 'Can manage services',
    example: false,
  })
  canManageServices: boolean;

  @ApiProperty({
    description: 'Can manage locations',
    example: false,
  })
  canManageLocations: boolean;

  @ApiProperty({
    description: 'Can view analytics',
    example: false,
  })
  canViewAnalytics: boolean;

  @ApiPropertyOptional({
    description: 'Bio',
    example: 'Experienced barber with 10+ years in the industry',
  })
  bio?: string;

  @ApiProperty({
    description: 'Average rating',
    example: 4.8,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Review count',
    example: 45,
  })
  reviewCount: number;
}
