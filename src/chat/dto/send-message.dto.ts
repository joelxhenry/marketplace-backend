import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Conversation ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  conversationId: string;

  @ApiProperty({
    description: 'Message content',
    maxLength: 5000,
    example: 'Hello, I have a question about your services',
  })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    description: 'Array of attachment URLs',
    type: [String],
    example: ['https://s3.amazonaws.com/bucket/file.pdf'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
