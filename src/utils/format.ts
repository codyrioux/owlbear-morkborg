/**
 * Utility functions for text formatting and readability.
 */

const MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in',
  'into', 'nor', 'of', 'on', 'onto', 'or', 'over', 'so', 'the', 'to', 'up', 'with', 'yet'
]);

/**
 * Formats a string to Title Case with proper capitalization for MÖRK BORG titles.
 * Preserves dice notation (e.g. d4, 2d6) and rule abbreviations (DR, HP, PC, GM),
 * and capitalizes the first letter of words while keeping minor connecting words lowercase.
 */
export function formatTitleCase(str: string): string {
  if (!str) return '';

  return str.replace(/\b[a-zA-Z0-9']+\b/g, (word, index) => {
    // Preserve dice notations (d4, 2d6, 3d10)
    if (/^d\d+$/i.test(word) || /^\d+d\d+.*$/i.test(word)) {
      return word.toLowerCase();
    }

    // Preserve core rule abbreviations
    const upper = word.toUpperCase();
    if (upper === 'DR' || upper === 'HP' || upper === 'PC' || upper === 'GM') {
      return upper;
    }

    // Lowercase minor words unless it's the first word of the string
    const lower = word.toLowerCase();
    if (index > 0 && MINOR_WORDS.has(lower)) {
      return lower;
    }

    // Capitalize only first letter, rest lowercase
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}
