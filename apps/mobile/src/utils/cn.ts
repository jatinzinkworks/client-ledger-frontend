/** Joins class names, skipping falsy ones. (No tailwind-merge on native — keep classes non-conflicting.) */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
