const {
  sanitizeEmail,
  sanitizeNumber,
  sanitizeObjectId,
  sanitizeFilename,
  sanitizeText,
} = require("../../utils/sanitizer");

describe("sanitizer", () => {
  test("sanitizeEmail validates and normalizes", () => {
    expect(sanitizeEmail("Foo@Example.COM")).toBeTruthy();
    expect(sanitizeEmail("not-an-email")).toBeNull();
  });

  test("sanitizeNumber enforces bounds", () => {
    expect(sanitizeNumber("5", { min: 1, max: 10 })).toBe(5);
    expect(sanitizeNumber("0", { min: 1, max: 10 })).toBeNull();
  });

  test("sanitizeObjectId validates mongo id", () => {
    const valid = "507f1f77bcf86cd799439011";
    expect(sanitizeObjectId(valid)).toBe(valid);
    expect(sanitizeObjectId("invalid")).toBeNull();
  });

  test("sanitizeFilename strips traversal", () => {
    expect(sanitizeFilename("../etc/passwd")).not.toContain("..");
  });

  test("sanitizeText truncates", () => {
    const long = "a".repeat(20);
    expect(sanitizeText(long, 5).length).toBe(5);
  });
});