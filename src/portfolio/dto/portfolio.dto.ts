import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsArray,
  IsUrl,
  Min,
  ValidateIf,
} from 'class-validator';
import { PortfolioItemType } from '@prisma/client';
import { Type } from 'class-transformer';

// Create Portfolio Item DTO
export class CreatePortfolioItemDto {
  @ApiProperty({
    description: 'Portfolio item title',
    example: 'Modern Wedding Photography',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Portfolio item description',
    example: 'Elegant wedding photography session with natural lighting',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Portfolio item type',
    enum: PortfolioItemType,
    example: PortfolioItemType.PHOTO,
  })
  @IsEnum(PortfolioItemType)
  @IsNotEmpty()
  type: PortfolioItemType;

  @ApiPropertyOptional({
    description: 'Image URL (required if type is PHOTO)',
    example: 'https://example.com/portfolio/wedding-photo.jpg',
  })
  @ValidateIf(o => o.type === PortfolioItemType.PHOTO)
  @IsUrl()
  @IsNotEmpty()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Video URL (required if type is VIDEO_YOUTUBE or VIDEO_VIMEO)',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @ValidateIf(o => o.type === PortfolioItemType.VIDEO_YOUTUBE || o.type === PortfolioItemType.VIDEO_VIMEO)
  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @ApiProperty({
    description: 'Portfolio category',
    example: 'Weddings',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({
    description: 'Searchable tags',
    type: [String],
    example: ['wedding', 'photography', 'outdoor'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Featured item',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

// Update Portfolio Item DTO
export class UpdatePortfolioItemDto {
  @ApiPropertyOptional({
    description: 'Portfolio item title',
    example: 'Modern Wedding Photography',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Portfolio item description',
    example: 'Elegant wedding photography session with natural lighting',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Image URL',
    example: 'https://example.com/portfolio/wedding-photo.jpg',
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Video URL',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Portfolio category',
    example: 'Weddings',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Searchable tags',
    type: [String],
    example: ['wedding', 'photography', 'outdoor'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Featured item',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

// Portfolio Item Response DTO
export class PortfolioItemResponseDto {
  @ApiProperty({
    description: 'Portfolio item ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  id: string;

  @ApiProperty({
    description: 'Provider ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  providerId: string;

  @ApiProperty({
    description: 'Portfolio item title',
    example: 'Modern Wedding Photography',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Portfolio item description',
    example: 'Elegant wedding photography session with natural lighting',
  })
  description?: string;

  @ApiProperty({
    description: 'Portfolio item type',
    enum: PortfolioItemType,
    example: PortfolioItemType.PHOTO,
  })
  type: PortfolioItemType;

  @ApiPropertyOptional({
    description: 'Image URL',
    example: 'https://example.com/portfolio/wedding-photo.jpg',
  })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Video URL',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Video ID for embedding',
    example: 'dQw4w9WgXcQ',
  })
  videoId?: string;

  @ApiProperty({
    description: 'Portfolio category',
    example: 'Weddings',
  })
  category: string;

  @ApiProperty({
    description: 'Searchable tags',
    type: [String],
    example: ['wedding', 'photography', 'outdoor'],
  })
  tags: string[];

  @ApiProperty({
    description: 'Sort order',
    example: 0,
  })
  sortOrder: number;

  @ApiProperty({
    description: 'Featured item',
    example: false,
  })
  isFeatured: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}

// Portfolio Item with Provider Response DTO
export class PortfolioItemWithProviderResponseDto extends PortfolioItemResponseDto {
  @ApiProperty({
    description: 'Provider information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'clx1y2z3a4b5c6d7e8f9g0h1' },
      businessName: { type: 'string', example: 'Elite Photography Studio' },
      logoUrl: { type: 'string', example: 'https://example.com/logo.png' },
      isVerified: { type: 'boolean', example: true },
    },
  })
  provider: {
    id: string;
    businessName: string;
    logoUrl?: string;
    isVerified: boolean;
  };
}
