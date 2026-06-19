/** Small display helpers shared across server + client components. */

/** "root-canal" → "Root Canal". */
export function prettifySlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Whole-minute duration between two ISO instants. */
export function durationMinutes(startISO: string, endISO: string): number {
  return Math.max(
    0,
    Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 60000),
  );
}
