import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

// Create User DTO (Admin only)
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1876-555-0123',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    example: UserRole.CUSTOMER,
    default: UserRole.CUSTOMER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

// Update User DTO
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1876-555-0123',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'User profile photo URL',
    example: 'https://example.com/photos/user123.jpg',
  })
  @IsString()
  @IsOptional()
  avatar?: string;
}

// Update User DTO (Admin - includes role)
export class AdminUpdateUserDto extends UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User role (Admin only)',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'User email address (Admin only)',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}

// User Response DTO
export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1876-555-0123',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'User profile photo URL',
    example: 'https://example.com/photos/user123.jpg',
  })
  avatar?: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  isEmailVerified: boolean;

  @ApiPropertyOptional({
    description: 'Google ID (if linked)',
    example: '1234567890',
  })
  googleId?: string;

  @ApiPropertyOptional({
    description: 'Apple ID (if linked)',
    example: '001234.abcd1234efgh5678.1234',
  })
  appleId?: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-01-20T14:30:00.000Z',
  })
  updatedAt: Date;
}

// User with Provider Info Response DTO
export class UserWithProvidersResponseDto extends UserResponseDto {
  @ApiProperty({
    description: 'Providers associated with this user',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clx1y2z3a4b5c6d7e8f9g0h1' },
        businessName: { type: 'string', example: 'Elite Cleaning Services' },
        isOwner: { type: 'boolean', example: true },
        title: { type: 'string', example: 'Owner' },
      },
    },
  })
  providers: {
    id: string;
    businessName: string;
    isOwner: boolean;
    title: string;
  }[];
}
