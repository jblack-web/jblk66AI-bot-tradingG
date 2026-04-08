/**
 * Sanitize a value to ensure it is a plain string (not a MongoDB operator object).
 * Returns the string if valid, or undefined if invalid.
 * @param {*} value
 * @returns {string|undefined}
 */
const sanitizeString = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  return value;
};

/**
 * Sanitize a value against an allowed list of enum strings.
 * Returns the value if it is in the allowed list, or undefined.
 * @param {*} value
 * @param {string[]} allowed
 * @returns {string|undefined}
 */
const sanitizeEnum = (value, allowed) => {
  const str = sanitizeString(value);
  if (!str) return undefined;
  return allowed.includes(str) ? str : undefined;
};

module.exports = { sanitizeString, sanitizeEnum };
