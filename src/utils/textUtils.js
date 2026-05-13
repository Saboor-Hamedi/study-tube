/**
 * Industrial Text Utilities for Neural Forensic Suite
 * Handles semantic truncation and formatting for consistency across modules.
 */

/**
 * Truncates a string to a specific number of words.
 * @param {string} text - The input text to truncate.
 * @param {number} limit - The maximum number of words allowed.
 * @returns {string} - The truncated string with an ellipsis if necessary.
 */
export const truncateWords = (text, limit = 20) => {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(" ") + "...";
};

/**
 * Truncates a string by character length for tight UI elements.
 * @param {string} text - The input text.
 * @param {number} length - Max character length.
 * @returns {string}
 */
export const truncateChars = (text, length = 100) => {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "...";
};
