import { OrganizationSlugExistsError } from '../../domain/registration/registration.errors.js';
import { RESERVED_ORG_SLUGS } from '../auth.constants.js';

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\da-z]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if a slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_ORG_SLUGS.includes(slug as (typeof RESERVED_ORG_SLUGS)[number]);
}

/**
 * Generate a unique slug with retry logic
 */
export async function generateUniqueSlug(
  baseName: string,
  checkExists: (slug: string) => Promise<boolean>,
  maxAttempts = 10
): Promise<string> {
  const baseSlug = generateSlug(baseName);

  // Check if reserved
  if (isReservedSlug(baseSlug)) {
    return generateUniqueSlug(`${baseName}-org`, checkExists, maxAttempts);
  }

  // Try base slug first
  if (!(await checkExists(baseSlug))) {
    return baseSlug;
  }

  // Try with incremental numbers
  for (let i = 1; i <= maxAttempts; i++) {
    const slugWithNumber = `${baseSlug}-${i}`;
    if (!(await checkExists(slugWithNumber))) {
      return slugWithNumber;
    }
  }

  // Throw error after exhausting all attempts
  throw new OrganizationSlugExistsError(baseSlug);
}
