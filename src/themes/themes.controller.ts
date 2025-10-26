import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ThemesService } from './themes.service';
import { ApplyThemeDto } from './dto/apply-theme.dto';
import { UpdateThemeCustomizationDto } from './dto/update-theme-customization.dto';

@ApiTags('themes')
@Controller('themes')
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Get('presets')
  @ApiOperation({
    summary: 'Get all theme presets',
    description: 'Get available theme presets. Free tier users see 3 presets, paid tier sees all 6.',
  })
  @ApiQuery({
    name: 'tier',
    required: false,
    enum: ['free', 'paid'],
    description: 'Filter by tier',
  })
  @ApiResponse({
    status: 200,
    description: 'List of theme presets',
  })
  getPresets(@Query('tier') tier?: 'free' | 'paid') {
    return {
      success: true,
      data: this.themesService.getPresets(tier),
    };
  }

  @Get('presets/:id')
  @ApiOperation({
    summary: 'Get theme preset by ID',
    description: 'Get a specific theme preset configuration',
  })
  @ApiParam({
    name: 'id',
    description: 'Preset ID (e.g., modern-green, classic-blue)',
    example: 'modern-green',
  })
  @ApiResponse({
    status: 200,
    description: 'Theme preset found',
  })
  @ApiResponse({
    status: 404,
    description: 'Theme preset not found',
  })
  getPresetById(@Param('id') id: string) {
    return {
      success: true,
      data: this.themesService.getPresetByIdOrFail(id),
    };
  }
}

@ApiTags('providers')
@Controller('providers')
export class ProviderThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Get(':providerId/theme')
  @ApiOperation({
    summary: "Get provider's current theme",
    description: 'Get the currently applied theme for a provider. Public endpoint for portfolio rendering.',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider theme retrieved',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  async getProviderTheme(@Param('providerId') providerId: string) {
    return {
      success: true,
      data: await this.themesService.getProviderTheme(providerId),
    };
  }

  @Post(':providerId/theme')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apply theme to provider',
    description: 'Apply a theme preset to a provider\'s portfolio with optional customizations',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Theme applied successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid customizations',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - no access to provider or tier restriction',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider or theme not found',
  })
  async applyTheme(
    @Param('providerId') providerId: string,
    @Body() dto: ApplyThemeDto,
    @Req() req: any,
  ) {
    return {
      success: true,
      data: await this.themesService.applyThemeToProvider(providerId, req.user.sub, dto),
    };
  }

  @Patch(':providerId/theme')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update provider theme customizations',
    description: 'Update color and CSS customizations for the provider\'s current theme',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Theme customizations updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid customizations',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - no access to provider or tier restriction',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider or theme settings not found',
  })
  async updateThemeCustomizations(
    @Param('providerId') providerId: string,
    @Body() dto: UpdateThemeCustomizationDto,
    @Req() req: any,
  ) {
    return {
      success: true,
      data: await this.themesService.updateProviderThemeCustomizations(
        providerId,
        req.user.sub,
        dto,
      ),
    };
  }

  @Delete(':providerId/theme')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset provider theme to default',
    description: 'Reset provider\'s theme to the default Modern Green preset',
  })
  @ApiParam({
    name: 'providerId',
    description: 'Provider ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Theme reset to default',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - no access to provider',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  async resetTheme(@Param('providerId') providerId: string, @Req() req: any) {
    return {
      success: true,
      data: await this.themesService.resetProviderTheme(providerId, req.user.sub),
    };
  }
}
