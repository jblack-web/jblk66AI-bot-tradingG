const mongoose = require('mongoose');

/**
 * Validate and cast a string to a Mongoose ObjectId.
 * Returns null if the value is not a valid ObjectId.
 */
function toObjectId(value) {
  if (!value) return null;
  const str = String(value);
  if (!mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
}

/**
 * Sanitize a plain string value to prevent NoSQL operator injection.
 * Returns null if the value is not a plain string.
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return null;
  return value.trim();
}

module.exports = { toObjectId, sanitizeString };
