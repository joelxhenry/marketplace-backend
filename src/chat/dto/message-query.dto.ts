import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class MessageQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Get messages before this message ID (for infinite scroll)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  beforeMessageId?: string;
}
