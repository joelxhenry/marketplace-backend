import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsString,
  IsDateString,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
  ValidateIf,
  IsEmail,
  Matches,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';

// Guest Info DTO
export class GuestInfoDto {
  @ApiProperty({ description: 'Guest first name', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Guest last name', example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Guest email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Guest phone number in international format',
    example: '+18761234567',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format',
  })
  phone?: string;
}

// Create Booking DTO
export class CreateBookingDto {
  @ApiPropertyOptional({
    description:
      'Customer user ID (required if guestInfo not provided). Either customerId or guestInfo must be provided, not both.',
    example: 'clx1y2z3a0000...',
  })
  @ValidateIf(o => !o.guestInfo)
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description:
      'Guest information (required if customerId not provided). Either customerId or guestInfo must be provided, not both.',
    type: GuestInfoDto,
  })
  @ValidateIf(o => !o.customerId)
  @ValidateNested()
  @Type(() => GuestInfoDto)
  guestInfo?: GuestInfoDto;

  @ApiProperty({
    description: 'Provider ID',
    example: 'clx1y2z3a0001...',
  })
  @IsUUID()
  providerId: string;

  @ApiProperty({
    description: 'Location ID where the service will be performed',
    example: 'clx1y2z3a0002...',
  })
  @IsUUID()
  locationId: string;

  @ApiPropertyOptional({
    description: 'User assigned to perform the service (team member)',
    example: 'clx1y2z3a0003...',
  })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiPropertyOptional({
    description: 'Provider user relationship ID',
    example: 'clx1y2z3a0004...',
  })
  @IsOptional()
  @IsUUID()
  providerUserId?: string;

  @ApiProperty({
    description: 'Booking start time (ISO 8601 format)',
    example: '2025-10-25T10:00:00.000Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'Booking end time (ISO 8601 format)',
    example: '2025-10-25T11:30:00.000Z',
  })
  @IsDateString()
  endTime: string;

  @ApiProperty({
    description: 'Array of service IDs to book',
    type: [String],
    example: ['clx1y2z3a0005...', 'clx1y2z3a0006...'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds: string[];

  @ApiPropertyOptional({
    description: 'Special requests or notes from the customer',
    example: 'Please use hypoallergenic products',
  })
  @IsOptional()
  @IsString()
  customerNotes?: string;
}

// Update Booking DTO
export class UpdateBookingDto {
  @ApiPropertyOptional({
    description: 'Updated start time (ISO 8601 format)',
    example: '2025-10-25T11:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Updated end time (ISO 8601 format)',
    example: '2025-10-25T12:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Updated customer notes',
    example: 'Changed preference to organic products',
  })
  @IsOptional()
  @IsString()
  customerNotes?: string;

  @ApiPropertyOptional({
    description: 'Updated assigned user ID',
    example: 'clx1y2z3a0003...',
  })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;
}

// Update Booking Status DTO
export class UpdateBookingStatusDto {
  @ApiProperty({
    description: 'New booking status',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @ApiPropertyOptional({
    description: 'Provider notes/reason for status change',
    example: 'Confirmed via phone call',
  })
  @IsOptional()
  @IsString()
  providerNotes?: string;
}

// Get Bookings Query DTO
export class GetBookingsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Filter by location ID',
    example: 'clx1y2z3a0002...',
  })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by assigned user ID',
    example: 'clx1y2z3a0003...',
  })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date (ISO 8601 format)',
    example: '2025-10-25T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (ISO 8601 format)',
    example: '2025-10-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

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
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;
}

// Booking Item Response DTO
export class BookingItemResponseDto {
  @ApiProperty({ description: 'Booking item ID' })
  id: string;

  @ApiProperty({ description: 'Service ID' })
  serviceId: string;

  @ApiProperty({ description: 'Service details' })
  service: {
    name: string;
    description?: string;
    duration: number;
    basePrice: number;
  };

  @ApiProperty({ description: 'Unit price at time of booking' })
  unitPrice: number;

  @ApiProperty({ description: 'Total price for this item' })
  total: number;
}

// Booking Response DTO
export class BookingResponseDto {
  @ApiProperty({ description: 'Booking ID' })
  id: string;

  @ApiProperty({ description: 'Is this a guest booking' })
  isGuestBooking: boolean;

  @ApiPropertyOptional({ description: 'Customer ID (if not guest booking)' })
  customerId?: string;

  @ApiPropertyOptional({ description: 'Customer details' })
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };

  @ApiPropertyOptional({ description: 'Guest first name (if guest booking)' })
  guestFirstName?: string;

  @ApiPropertyOptional({ description: 'Guest last name (if guest booking)' })
  guestLastName?: string;

  @ApiPropertyOptional({ description: 'Guest email (if guest booking)' })
  guestEmail?: string;

  @ApiPropertyOptional({ description: 'Guest phone (if guest booking)' })
  guestPhone?: string;

  @ApiProperty({ description: 'Provider ID' })
  providerId: string;

  @ApiProperty({ description: 'Provider details' })
  provider: {
    businessName: string;
    businessPhone?: string;
    businessEmail?: string;
    logoUrl?: string;
  };

  @ApiProperty({ description: 'Location ID' })
  locationId: string;

  @ApiProperty({ description: 'Location details' })
  location: {
    name?: string;
    address: string;
    city: string;
    parish: string;
    latitude?: string;
    longitude?: string;
  };

  @ApiPropertyOptional({ description: 'Assigned user ID' })
  assignedUserId?: string;

  @ApiPropertyOptional({ description: 'Assigned user details' })
  assignedUser?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };

  @ApiProperty({ description: 'Booking start time' })
  startTime: Date;

  @ApiProperty({ description: 'Booking end time' })
  endTime: Date;

  @ApiProperty({ description: 'Booking status', enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty({ description: 'Subtotal amount' })
  subtotal: number;

  @ApiProperty({ description: 'Tax amount (12.5% GCT)' })
  taxAmount: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Customer notes' })
  customerNotes?: string;

  @ApiPropertyOptional({ description: 'Provider notes' })
  providerNotes?: string;

  @ApiProperty({ description: 'Booking items', type: [BookingItemResponseDto] })
  items: BookingItemResponseDto[];

  @ApiPropertyOptional({ description: 'Payment information' })
  payment?: {
    status: string;
    amount: number;
    gateway?: string;
  };

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated timestamp' })
  updatedAt: Date;
}

// Assign Booking DTO
export class AssignBookingDto {
  @ApiProperty({
    description: 'User ID to assign the booking to',
    example: 'clx1y2z3a0003...',
  })
  @IsUUID()
  assignedUserId: string;
}

// Get Guest Bookings Query DTO
export class GetGuestBookingsDto {
  @ApiProperty({
    description: 'Email address to retrieve guest bookings',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;
}
