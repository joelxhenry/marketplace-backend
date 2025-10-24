/**
 * Slug Generation Utility
 * Generates URL-friendly slugs from text strings
 */

/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 *
 * @example
 * generateSlug("Best Barber Shop") // returns "best-barber-shop"
 * generateSlug("John's Cleaning Service") // returns "johns-cleaning-service"
 * generateSlug("A+ Landscaping & Design") // returns "a-landscaping-design"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remove special characters except spaces and hyphens
    .replace(/[^\w\s-]/g, '')
    // Replace whitespace with hyphens
    .replace(/\s+/g, '-')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug by appending a number if necessary
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 *
 * @example
 * generateUniqueSlug("best-barber", ["best-barber", "best-barber-2"])
 * // returns "best-barber-3"
 */
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
): string {
  let slug = baseSlug;
  let counter = 2;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Validate if a string is a valid slug format
 * @param slug - The slug to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidSlug("best-barber-shop") // returns true
 * isValidSlug("Best Barber Shop") // returns false (has uppercase and spaces)
 * isValidSlug("best--barber") // returns false (double hyphens)
 */
export function isValidSlug(slug: string): boolean {
  // Slug should be lowercase, alphanumeric with hyphens only
  // No leading/trailing hyphens, no consecutive hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Sanitize a slug to ensure it meets all requirements
 * @param slug - The slug to sanitize
 * @param maxLength - Maximum length for the slug (default: 50)
 * @returns A sanitized slug
 */
export function sanitizeSlug(slug: string, maxLength: number = 50): string {
  const sanitized = generateSlug(slug);
  return sanitized.substring(0, maxLength);
}
