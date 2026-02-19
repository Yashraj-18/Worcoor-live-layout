// Utility helpers for working with warehouse location IDs
// Ensures consistent comparisons regardless of whitespace, casing, or separators
export const normalizeLocationId = (value?: string | null): string => {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toUpperCase()
    // Treat spaces/underscores/dashes the same when comparing IDs
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
};
