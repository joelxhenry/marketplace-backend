import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RespondReviewDto {
  @ApiProperty({
    description: 'Provider response to review',
    maxLength: 1000,
    example:
      'Thank you so much for the kind words! We look forward to serving you again.',
  })
  @IsString()
  @MaxLength(1000)
  response: string;
}
