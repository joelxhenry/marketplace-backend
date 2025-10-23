import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Array of user IDs to include in conversation',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @ApiPropertyOptional({
    description: 'Initial message content',
    example: 'Hi, I would like to book a service',
  })
  @IsString()
  @IsOptional()
  initialMessage?: string;
}
