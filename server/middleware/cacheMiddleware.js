const NodeCache = require("node-cache");

// Shared in-memory cache for API responses
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const cacheMiddleware = (duration = 60) => (req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  const key = `${req.originalUrl}::${req.user ? req.user._id : "anon"}`;
  const cached = cache.get(key);

  if (cached) {
    res.set("X-Cache", "HIT");
    return res.json(cached);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.set(key, body, duration);
    }
    res.set("X-Cache", "MISS");
    return originalJson(body);
  };

  next();
};

const invalidateCache = (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    cache.flushAll();
  }
  next();
};

module.exports = { cache, cacheMiddleware, invalidateCache };