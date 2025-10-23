import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ModerateReviewDto {
  @ApiProperty({
    description: 'Whether to approve the review',
    example: true,
  })
  @IsBoolean()
  isApproved: boolean;
}
