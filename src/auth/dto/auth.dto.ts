import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

// Google OAuth Authentication
export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google OAuth access token',
    example: 'ya29.a0AfH6SMBx...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

// Apple Sign In Authentication
export class AppleAuthDto {
  @ApiProperty({
    description: 'Apple identity token (JWT)',
    example: 'eyJraWQiOiJmaDZCczhDIiw...',
  })
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @ApiProperty({
    description: 'Apple authorization code',
    example: 'c1a2b3c4d5e6f7g8h9i0...',
  })
  @IsString()
  @IsNotEmpty()
  authorizationCode: string;

  @ApiPropertyOptional({
    description: 'User information (only provided on first sign in)',
    example: { name: { firstName: 'John', lastName: 'Doe' } },
  })
  @IsOptional()
  user?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
    email?: string;
  };
}

// Email/Password Registration
export class RegisterDto {
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
}

// Email/Password Login
export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

// Token Refresh
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

// User Information in Authentication Response
export class AuthUserResponseDto {
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
  photoUrl?: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}

// Authentication Response
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.4Adcj_Clr7fN8b8_JvVG3VzHRMVzFvV5vGVRhZT-7U0',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'User information',
    type: AuthUserResponseDto,
  })
  user: AuthUserResponseDto;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
    default: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;
}
