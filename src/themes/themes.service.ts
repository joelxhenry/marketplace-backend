import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ApplyThemeDto } from './dto/apply-theme.dto';
import { UpdateThemeCustomizationDto } from './dto/update-theme-customization.dto';
import {
  ALL_PRESETS,
  FREE_PRESETS,
  getPresetById,
  ThemePreset,
} from './presets/theme-presets';
import { validateCustomizations, sanitizeCss } from './utils/validation.util';

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Get all available theme presets based on tier
   */
  getPresets(tier?: 'free' | 'paid'): ThemePreset[] {
    if (tier === 'free') {
      return FREE_PRESETS;
    }
    // Paid tier or no tier specified gets all presets
    return ALL_PRESETS;
  }

  /**
   * Get a specific preset by ID
   */
  getPresetByIdOrFail(id: string): ThemePreset {
    const preset = getPresetById(id);
    if (!preset) {
      throw new NotFoundException(`Theme preset with ID "${id}" not found`);
    }
    return preset;
  }

  /**
   * Get provider's current theme settings
   * Public endpoint - no auth required
   */
  async getProviderTheme(providerId: string) {
    // Check if provider exists
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        businessName: true,
        subscriptionPlan: true,
      },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID "${providerId}" not found`);
    }

    // Get theme settings
    const themeSettings = await this.prisma.providerThemeSettings.findUnique({
      where: { providerId },
    });

    // If no theme settings, return default theme
    if (!themeSettings) {
      const defaultTheme = getPresetById('modern-green');
      return {
        providerId,
        themeId: 'modern-green',
        theme: defaultTheme,
        customizations: {},
        isActive: true,
        createdAt: provider.id, // Use provider creation as fallback
        updatedAt: provider.id,
      };
    }

    // Get the theme preset
    const theme = getPresetById(themeSettings.themePresetId || 'modern-green');

    return {
      providerId,
      themeId: themeSettings.themePresetId,
      theme,
      customizations: {
        primaryColor: themeSettings.primaryColor,
        accentColor: themeSettings.accentColor,
        customCss: themeSettings.customCss,
      },
      isActive: true,
      createdAt: themeSettings.createdAt,
      updatedAt: themeSettings.updatedAt,
    };
  }

  /**
   * Apply a theme to a provider's portfolio
   */
  async applyThemeToProvider(providerId: string, userId: string, dto: ApplyThemeDto) {
    // Verify provider exists and user has access
    await this.verifyProviderAccess(providerId, userId);

    // Verify theme exists
    const preset = this.getPresetByIdOrFail(dto.themeId);

    // Get provider's subscription tier
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      select: { subscriptionPlan: true },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID "${providerId}" not found`);
    }

    const tier = provider.subscriptionPlan === 'BASIC' ? 'free' : 'paid';

    // Check tier access to preset
    if (preset.tier === 'paid' && tier === 'free') {
      throw new ForbiddenException(
        'This theme is only available on paid subscription plans',
      );
    }

    // Validate customizations
    if (dto.customizations) {
      const validation = validateCustomizations(dto.customizations, tier);
      if (!validation.valid) {
        throw new BadRequestException({
          message: 'Invalid theme customizations',
          errors: validation.errors,
        });
      }
    }

    // Sanitize custom CSS if provided
    const customCss = dto.customizations?.customCss
      ? sanitizeCss(dto.customizations.customCss)
      : null;

    // Upsert theme settings
    const themeSettings = await this.prisma.providerThemeSettings.upsert({
      where: { providerId },
      create: {
        providerId,
        themePresetId: dto.themeId,
        primaryColor: dto.customizations?.primaryColor,
        accentColor: dto.customizations?.accentColor,
        customCss,
      },
      update: {
        themePresetId: dto.themeId,
        primaryColor: dto.customizations?.primaryColor,
        accentColor: dto.customizations?.accentColor,
        customCss,
      },
    });

    return {
      providerId,
      themeId: dto.themeId,
      customizations: {
        primaryColor: themeSettings.primaryColor,
        accentColor: themeSettings.accentColor,
        customCss: themeSettings.customCss,
      },
      isActive: true,
      updatedAt: themeSettings.updatedAt,
    };
  }

  /**
   * Update provider's theme customizations
   */
  async updateProviderThemeCustomizations(
    providerId: string,
    userId: string,
    dto: UpdateThemeCustomizationDto,
  ) {
    // Verify provider exists and user has access
    await this.verifyProviderAccess(providerId, userId);

    // Get current theme settings
    const currentSettings = await this.prisma.providerThemeSettings.findUnique({
      where: { providerId },
    });

    if (!currentSettings) {
      throw new NotFoundException(
        `No theme settings found for provider "${providerId}". Please apply a theme first.`,
      );
    }

    // Get provider's subscription tier
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      select: { subscriptionPlan: true },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID "${providerId}" not found`);
    }

    const tier = provider.subscriptionPlan === 'BASIC' ? 'free' : 'paid';

    // Validate customizations
    const validation = validateCustomizations(dto, tier);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid theme customizations',
        errors: validation.errors,
      });
    }

    // Sanitize custom CSS if provided
    const customCss = dto.customCss ? sanitizeCss(dto.customCss) : undefined;

    // Update theme settings
    const updated = await this.prisma.providerThemeSettings.update({
      where: { providerId },
      data: {
        primaryColor: dto.primaryColor ?? currentSettings.primaryColor,
        accentColor: dto.accentColor ?? currentSettings.accentColor,
        customCss: customCss ?? currentSettings.customCss,
      },
    });

    return {
      providerId,
      themeId: updated.themePresetId,
      customizations: {
        primaryColor: updated.primaryColor,
        accentColor: updated.accentColor,
        customCss: updated.customCss,
      },
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Reset provider's theme to default
   */
  async resetProviderTheme(providerId: string, userId: string) {
    // Verify provider exists and user has access
    await this.verifyProviderAccess(providerId, userId);

    // Delete theme settings (will revert to default)
    await this.prisma.providerThemeSettings.deleteMany({
      where: { providerId },
    });

    return {
      message: 'Theme reset to default successfully',
      themeId: 'modern-green',
    };
  }

  /**
   * Verify user has access to provider
   */
  private async verifyProviderAccess(providerId: string, userId: string): Promise<void> {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        providerUsers: {
          where: {
            userId,
            isActive: true,
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID "${providerId}" not found`);
    }

    if (provider.providerUsers.length === 0) {
      throw new ForbiddenException(
        'You do not have permission to manage this provider\'s theme',
      );
    }
  }
}
