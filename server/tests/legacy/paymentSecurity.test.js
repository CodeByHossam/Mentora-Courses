/**
 * Payment Security Test Suite
 *
 * Comprehensive tests for payment security implementation including
 * XSS prevention, CSRF protection, rate limiting, input validation, and more.
 *
 * @author Mentora Team
 * @version 1.0.0
 */

process.env.NODE_ENV = "test";

const request = require("supertest");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const app = require("../server"); // Adjust path as needed
const User = require("../models/User");
const Course = require("../models/Course");
const Category = require("../models/Category");
const Payment = require("../models/Payment");

describe("Payment Security Tests", () => {
  let authToken;
  let csrfToken;
  let testUser;
  let testCourse;

  beforeAll(async () => {
    // Wait for the in-memory database started by server.js
    const dbStart = Date.now();
    while (mongoose.connection.readyState !== 1 && Date.now() - dbStart < 30000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (mongoose.connection.readyState !== 1) {
      throw new Error("DB connection timeout");
    }

    // Create test user
    testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "student",
      isVerified: true,
      isActive: true,
    });

    // Create test category
    const testCategory = await Category.create({
      name: "Test Category",
      description: "Test category for payment security tests",
      icon: "book",
      imageUrl: "https://placehold.co/600x400?text=Category",
    });

    // Create test course
    testCourse = await Course.create({
      title: "Test Course",
      description: "Test course description",
      price: 99.99,
      finalPrice: 99.99,
      category: testCategory._id,
      topics: ["testing"],
      instructor: testUser._id,
      status: "published",
    });

    // Get auth token
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    authToken = loginResponse.body.data.accessToken;

    // Get CSRF token
    const csrfResponse = await request(app)
      .get("/api/payments/csrf-token")
      .set("Authorization", `Bearer ${authToken}`);

    csrfToken = csrfResponse.body.data.csrfToken;
  });

  afterAll(async () => {
    // Cleanup test data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Category.deleteMany({});
    await Payment.deleteMany({});
    await mongoose.connection.close();
    if (global.__MONGOD__) {
      await global.__MONGOD__.stop();
    }
  });

  describe("Input Validation Tests", () => {
    test("should reject invalid course ID in payment initiation", async () => {
      const response = await request(app)
        .post("/api/payments/initiate")
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-CSRF-Token", csrfToken)
        .send({
          courseId: "invalid-id",
          method: "stripe",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test("should reject XSS attempts in direct transfer details", async () => {
      const maliciousInput = '<script>alert("xss")</script>';

      const response = await request(app)
        .post("/api/payments/direct-transfer")
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-CSRF-Token", csrfToken)
        .field("paymentId", testCourse._id.toString())
        .field("transferDetails[bankName]", maliciousInput)
        .field("transferDetails[accountNumber]", "1234567890")
        .field("transferDetails[transferAmount]", "99.99")
        .field("transferDetails[transferDate]", new Date().toISOString())
        .attach("receipt", Buffer.from("fake pdf"), "receipt.pdf");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should validate Stripe payment intent ID format", async () => {
      const response = await request(app)
        .post("/api/payments/stripe/confirm")
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-CSRF-Token", csrfToken)
        .send({
          paymentIntentId: "invalid-format",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test("should validate PayPal order ID format", async () => {
      const response = await request(app)
        .post("/api/payments/paypal/confirm")
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-CSRF-Token", csrfToken)
        .send({
          orderId: "invalid@format!",
          paymentId: testCourse._id.toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("CSRF Protection Tests", () => {
    test("should reject requests without CSRF token", async () => {
      const response = await request(app)
        .post("/api/payments/initiate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          courseId: testCourse._id.toString(),
          method: "stripe",
        });

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe("CSRF_TOKEN_INVALID");
    });

    test("should reject requests with invalid CSRF token", async () => {
      const response = await request(app)
        .post("/api/payments/initiate")
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-CSRF-Token", "invalid-token")
        .send({
          courseId: testCourse._id.toString(),
          method: "stripe",
        });

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe("CSRF_TOKEN_INVALID");
    });

    test("should accept requests with valid CSRF token", async () => {
      const response = await request(app)
        .post("/api/payments/initiate")
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-CSRF-Token", csrfToken)
        .send({
          courseId: testCourse._id.toString(),
          method: "stripe",
        });

      // Should not fail due to CSRF (may fail for other reasons like Stripe config)
      expect(response.status).not.toBe(403);
    });
  });

  describe("Rate Limiting Tests", () => {
    test("should enforce rate limits on payment initiation", async () => {
      const requests = [];

      // Make 6 requests (limit is 5 per 15 minutes)
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post("/api/payments/initiate")
            .set("Authorization", `Bearer ${authToken}`)
            .set("X-CSRF-Token", csrfToken)
            .send({
              courseId: testCourse._id.toString(),
              method: "stripe",
            }),
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find((res) => res.status === 429);

      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse.body.error).toContain(
        "Too many payment attempts",
      );
    });

    test("should enforce rate limits on direct transfer uploads", async () => {
      const requests = [];

      // Make 4 requests (limit is 3 per 30 minutes)
      for (let i = 0; i < 4; i++) {
        requests.push(
          request(app)
            .post("/api/payments/direct-transfer")
            .set("Authorization", `Bearer ${authToken}`)
            .set("X-CSRF-Token", csrfToken)
            .field("paymentId", testCourse._id.toString())
            .field("transferDetails[bankName]", "Test Bank")
            .field("transferDetails[accountNumber]", "1234567890")
            .field("transferDetails[transferAmount]", "99.99")
            .field("transferDetails[transferDate]", new Date().toISOString())
            .attach("receipt", Buffer.from("fake pdf"), "receipt.pdf"),
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find((res) => res.status === 429);

      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse.body.error).toContain(
        "Too many direct transfer submissions",
      );
    });
  });

  describe("File Upload Security Tests", () => {
    test("should reject oversized files", async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB (limit is 5MB)

      const response = await request(app)
        .post("/api/payments/direct-transfer")
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-CSRF-Token", csrfToken)
        .field("paymentId", testCourse._id.toString())
        .field("transferDetails[bankName]", "Test Bank")
        .field("transferDetails[accountNumber]", "1234567890")
        .field("transferDetails[transferAmount]", "99.99")
        .field("transferDetails[transferDate]", new Date().toISOString())
        .attach("receipt", largeBuffer, "large-receipt.pdf");

      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe("FILE_TOO_LARGE");
    });

    test("should reject invalid file types", async () => {
      const response = await request(app)
        .post("/api/payments/direct-transfer")
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-CSRF-Token", csrfToken)
        .field("paymentId", testCourse._id.toString())
        .field("transferDetails[bankName]", "Test Bank")
        .field("transferDetails[accountNumber]", "1234567890")
        .field("transferDetails[transferAmount]", "99.99")
        .field("transferDetails[transferDate]", new Date().toISOString())
        .attach("receipt", Buffer.from("fake executable"), "malicious.exe");

      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe("INVALID_FILE_TYPE");
    });
  });

  describe("Authentication Tests", () => {
    test("should reject unauthenticated requests", async () => {
      const response = await request(app).post("/api/payments/initiate").send({
        courseId: testCourse._id.toString(),
        method: "stripe",
      });

      expect(response.status).toBe(401);
      expect(response.body.errorCode).toBe("UNAUTHORIZED");
    });

    test("should reject requests with invalid tokens", async () => {
      const response = await request(app)
        .post("/api/payments/initiate")
        .set("Authorization", "Bearer invalid-token")
        .send({
          courseId: testCourse._id.toString(),
          method: "stripe",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("Error Handling Tests", () => {
    test("should return structured error responses", async () => {
      const response = await request(app)
        .post("/api/payments/initiate")
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-CSRF-Token", csrfToken)
        .send({
          courseId: "invalid-id",
          method: "invalid-method",
        });

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("errorCode");
      expect(response.body).toHaveProperty("errors");
    });

    test("should not leak sensitive information in errors", async () => {
      const response = await request(app)
        .post("/api/payments/stripe/confirm")
        .set("Authorization", `Bearer ${authToken}`)
        .set("X-CSRF-Token", csrfToken)
        .send({
          paymentIntentId: "pi_invalid_test_id",
        });

      expect(response.body.message).not.toContain("secret");
      expect(response.body.message).not.toContain("key");
      expect(response.body.message).not.toContain("password");
    });
  });

  describe("Webhook Security Tests", () => {
    test("should reject webhooks without proper signatures", async () => {
      const response = await request(app)
        .post("/api/webhooks/stripe")
        .send({
          type: "payment_intent.succeeded",
          data: { object: { id: "pi_test" } },
        });

      expect(response.status).toBe(400);
      expect(response.text).toContain("Missing signature header");
    });

    test("should validate webhook IP addresses in production", async () => {
      // This test would need to be adapted based on your IP validation logic
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const response = await request(app)
        .post("/api/webhooks/stripe")
        .set("stripe-signature", "invalid-signature")
        .send({
          type: "payment_intent.succeeded",
          data: { object: { id: "pi_test" } },
        });

      expect(response.status).toBe(403);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Input Sanitization Tests", () => {
    test("should sanitize HTML in admin notes", async () => {
      // Create admin user for this test
      const adminUser = await User.create({
        name: "Admin User",
        email: "admin@example.com",
        password: await bcrypt.hash("password123", 10),
        role: "admin",
        isVerified: true,
        isActive: true,
      });

      const adminLoginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@example.com",
          password: "password123",
        });

      const adminToken = adminLoginResponse.body.data.accessToken;

      const adminCsrfResponse = await request(app)
        .get("/api/payments/csrf-token")
        .set("Authorization", `Bearer ${adminToken}`);

      const adminCsrfToken = adminCsrfResponse.body.data.csrfToken;

      // Create a test payment first
      const payment = await Payment.create({
        userId: testUser._id,
        student: testUser._id,
        course: testCourse._id,
        amount: 99.99,
        finalAmount: 99.99,
        method: "direct_transfer",
        status: "pending",
      });

      const maliciousNote = '<script>alert("xss")</script><b>Bold text</b>';

      const response = await request(app)
        .post(`/api/payments/${payment._id}/approve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", adminCsrfToken)
        .send({
          approved: true,
          adminNote: maliciousNote,
        });

      // The request should succeed but the note should be sanitized
      if (response.status === 200) {
        const updatedPayment = await Payment.findById(payment._id);
        expect(updatedPayment.adminNote).not.toContain("<script>");
        expect(updatedPayment.adminNote).not.toContain("alert");
      }

      await User.findByIdAndDelete(adminUser._id);
      await Payment.findByIdAndDelete(payment._id);
    });
  });

  describe("Performance Tests", () => {
    test("should handle concurrent requests efficiently", async () => {
      const startTime = Date.now();
      const concurrentRequests = 10;

      const requests = Array(concurrentRequests)
        .fill()
        .map(() =>
          request(app)
            .get("/api/payments/my-payments")
            .set("Authorization", `Bearer ${authToken}`),
        );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds

      // All responses should be successful (or consistently rate limited)
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });
});

module.exports = {
  // Export test utilities for other test files
  createTestUser: async (userData) => {
    return await User.create(userData);
  },

  createTestCourse: async (courseData) => {
    return await Course.create(courseData);
  },

  getAuthToken: async (email, password) => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password });
    return response.body.data.accessToken;
  },

  getCSRFToken: async (authToken) => {
    const response = await request(app)
      .get("/api/payments/csrf-token")
      .set("Authorization", `Bearer ${authToken}`);
    return response.body.data.csrfToken;
  },
};
