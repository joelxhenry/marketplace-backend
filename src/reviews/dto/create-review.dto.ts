import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsOptional,
  IsArray,
  IsUrl,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Booking ID for this review',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  bookingId: string;

  @ApiProperty({
    description: 'Rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Review comment',
    maxLength: 2000,
    example:
      'Amazing service! Very professional and the results exceeded my expectations.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({
    description: 'Array of photo URLs',
    type: [String],
    example: ['https://s3.amazonaws.com/bucket/photo1.jpg'],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  photos?: string[];
}
