const createError = require("../../utils/createError");

describe("createError", () => {
  test("supports (statusCode, message) order", () => {
    const err = createError(404, "Not found");
    expect(err.message).toBe("Not found");
    expect(err.statusCode).toBe(404);
  });

  test("supports (message, statusCode) order", () => {
    const err = createError("Boom", 500);
    expect(err.message).toBe("Boom");
    expect(err.statusCode).toBe(500);
  });

  test("defaults status code to 500", () => {
    const err = createError("Oops");
    expect(err.statusCode).toBe(500);
  });
});