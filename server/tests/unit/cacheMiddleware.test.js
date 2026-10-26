const { cache, cacheMiddleware, invalidateCache } = require("../../middleware/cacheMiddleware");

describe("cacheMiddleware", () => {
  beforeEach(() => {
    cache.flushAll();
  });

  test("passes through non-GET requests", () => {
    const req = { method: "POST", originalUrl: "/api/test", user: null };
    const res = { json: jest.fn() };
    const next = jest.fn();

    cacheMiddleware()(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.set).toBeUndefined();
  });

  test("returns MISS on first GET and stores value", () => {
    const req = { method: "GET", originalUrl: "/api/test", user: { _id: "123" } };
    const res = {
      statusCode: 200,
      set: jest.fn(),
      json: jest.fn((body) => body),
    };
    const next = jest.fn();

    cacheMiddleware(30)(req, res, next);
    expect(next).toHaveBeenCalled();

    const originalJson = res.json;
    res.json({ value: 42 });

    expect(res.set).toHaveBeenCalledWith("X-Cache", "MISS");
    expect(cache.get("/api/test::123")).toEqual({ value: 42 });
  });

  test("returns cached value on second GET", () => {
    const key = "/api/test::anon";
    cache.set(key, { value: 7 }, 30);

    const req = { method: "GET", originalUrl: "/api/test", user: null };
    const res = {
      set: jest.fn(),
      json: jest.fn(),
    };
    const next = jest.fn();

    cacheMiddleware(30)(req, res, next);

    expect(res.set).toHaveBeenCalledWith("X-Cache", "HIT");
    expect(res.json).toHaveBeenCalledWith({ value: 7 });
    expect(next).not.toHaveBeenCalled();
  });

  test("invalidateCache flushes on mutating methods", () => {
    cache.set("key", "value", 30);
    const req = { method: "POST" };
    const res = {};
    const next = jest.fn();

    invalidateCache(req, res, next);

    expect(cache.get("key")).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  test("invalidateCache does not flush on GET", () => {
    cache.set("key", "value", 30);
    const req = { method: "GET" };
    const res = {};
    const next = jest.fn();

    invalidateCache(req, res, next);

    expect(cache.get("key")).toBe("value");
    expect(next).toHaveBeenCalled();
  });
});