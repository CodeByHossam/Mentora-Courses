/**
 * Normalize a topics value into an array of strings.
 * Accepts arrays, JSON strings, or comma-separated strings.
 */
const parseTopics = (topics) => {
  if (Array.isArray(topics)) return topics;
  if (typeof topics !== 'string') return [];
  const trimmed = topics.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // fall through to comma split
    }
  }
  return trimmed.split(',').map((t) => t.trim()).filter(Boolean);
};

module.exports = parseTopics;
module.exports.parseTopics = parseTopics;
