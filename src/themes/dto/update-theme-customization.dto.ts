import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateThemeCustomizationDto {
  @ApiPropertyOptional({
    description: 'Override primary color (hex format)',
    example: '#22c55e',
  })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'Override accent color (hex format)',
    example: '#3b82f6',
  })
  @IsString()
  @IsOptional()
  accentColor?: string;

  @ApiPropertyOptional({
    description: 'Custom CSS (paid tier only, max 10KB)',
    example: '.custom-class { color: red; }',
  })
  @IsString()
  @IsOptional()
  @MaxLength(10240)
  customCss?: string;
}
