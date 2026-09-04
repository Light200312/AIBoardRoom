// ─────────────────────────────────────────────────────────────
// Shared utility functions used across services and controllers.
// Import from here instead of duplicating within individual files.
// ─────────────────────────────────────────────────────────────

/**
 * Clamp a numeric value within [min, max].
 * Returns `fallback` when the input is not a finite number.
 */
function clampNumber(value, { min, max, fallback }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Extract the first complete JSON object `{...}` from a raw string.
 * Useful for pulling structured data out of LLM responses.
 * Returns `null` if no valid object boundaries are found.
 */
function extractFirstJsonObject(text = "") {
  const s = String(text || "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return s.slice(start, end + 1);
}

/**
 * Convert a string into a URL-friendly slug (lowercase, hyphenated).
 * Strips quotes/punctuation, collapses runs of non-alphanumeric chars,
 * and caps at 48 characters.
 */
function slugify(input = "") {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/['".,]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Derive 2-3 uppercase initials from a full name.
 * Falls back to "AG" when the name is empty.
 */
function computeInitials(name = "") {
  const tokens = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return "AG";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  const letters = tokens.map((t) => t[0]).join("");
  return letters.slice(0, 3).toUpperCase();
}

/**
 * Generate a unique agent ID by slugifying the name and appending a random suffix.
 * Format: `c-<slug>-<6-char-random>`
 */
function generateAgentId(name) {
  const slug = slugify(name) || "agent";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `c-${slug}-${suffix}`;
}

/**
 * Count the number of whitespace-delimited words in a string.
 */
function countWords(text = "") {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Truncate text to `maxChars` and append an ellipsis when it overflows.
 */
function truncateText(text = "", maxChars = 400) {
  const safe = String(text || "");
  return safe.length > maxChars ? `${safe.slice(0, maxChars - 1)}…` : safe;
}

/**
 * Generate a unique message ID.
 * Format: `m-<timestamp>-<6-char-random>`
 */
function generateMessageId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Escape special regex characters in a string so it can be used
 * safely inside `new RegExp(...)`.
 */
function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Lowercase-normalize any value to a string.
 * Returns an empty string for nullish inputs.
 */
function normaliseText(value) {
  return String(value || "").toLowerCase();
}

/**
 * Map an array to trimmed, non-empty strings.
 * Returns an empty array for non-array inputs.
 */
function sanitizeStringArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => String(item).trim()).filter(Boolean);
}

/**
 * Remove undefined keys from a plain object (mutates & returns it).
 */
function stripUndefined(obj) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) delete obj[key];
  });
  return obj;
}

export {
  clampNumber,
  extractFirstJsonObject,
  slugify,
  computeInitials,
  generateAgentId,
  countWords,
  truncateText,
  generateMessageId,
  escapeRegex,
  normaliseText,
  sanitizeStringArray,
  stripUndefined,
};
