/**
 * Theme Validation Utilities
 * Color validation and WCAG AA contrast checking
 */

/**
 * Validate if a string is a valid color format
 * Supports: hex (#RGB, #RRGGBB), rgb/rgba, hsl/hsla
 */
export function isValidColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }

  const trimmed = color.trim();

  // Hex format: #RGB or #RRGGBB
  const hexPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
  if (hexPattern.test(trimmed)) {
    return true;
  }

  // RGB/RGBA format: rgb(r, g, b) or rgba(r, g, b, a)
  const rgbPattern = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/;
  if (rgbPattern.test(trimmed)) {
    const match = trimmed.match(rgbPattern);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      return r <= 255 && g <= 255 && b <= 255;
    }
  }

  // HSL/HSLA format: hsl(h, s%, l%) or hsla(h, s%, l%, a)
  const hslPattern = /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/;
  if (hslPattern.test(trimmed)) {
    const match = trimmed.match(hslPattern);
    if (match) {
      const h = parseInt(match[1], 10);
      const s = parseInt(match[2], 10);
      const l = parseInt(match[3], 10);
      return h <= 360 && s <= 100 && l <= 100;
    }
  }

  return false;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 * @returns Contrast ratio (e.g., 4.5, 7.2) or null if invalid colors
 */
export function getContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return null;
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * Normal text: 4.5:1 minimum
 * Large text: 3:1 minimum
 */
export function meetsContrastAA(ratio: number | null, isLargeText: boolean = false): boolean {
  if (ratio === null) {
    return false;
  }

  const minRatio = isLargeText ? 3.0 : 4.5;
  return ratio >= minRatio;
}

/**
 * Sanitize custom CSS to prevent XSS attacks
 * Basic sanitization - removes script tags and dangerous patterns
 */
export function sanitizeCss(css: string): string {
  if (!css) return '';

  // Remove script tags and event handlers
  let sanitized = css.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/expression\s*\(/gi, '');

  // Limit to CSS only - remove potential HTML/JS
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  return sanitized.trim();
}

/**
 * Validate theme customizations based on tier
 */
export function validateCustomizations(
  customizations: any,
  tier: 'free' | 'paid',
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!customizations) {
    return { valid: true, errors: [] };
  }

  // Validate primary color if provided
  if (customizations.primaryColor && !isValidColor(customizations.primaryColor)) {
    errors.push('Invalid primary color format');
  }

  // Validate accent color if provided
  if (customizations.accentColor && !isValidColor(customizations.accentColor)) {
    errors.push('Invalid accent color format');
  }

  // Check tier restrictions for custom CSS
  if (customizations.customCss) {
    if (tier === 'free') {
      errors.push('Custom CSS is only available on paid tier');
    } else {
      // Validate CSS size (max 10KB)
      if (customizations.customCss.length > 10240) {
        errors.push('Custom CSS exceeds maximum size of 10KB');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
