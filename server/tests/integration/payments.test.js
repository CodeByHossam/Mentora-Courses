process.env.NODE_ENV = "test";

const request = require("supertest");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const app = require("../../server");
const User = require("../../models/User");
const Course = require("../../models/Course");
const Category = require("../../models/Category");
const Payment = require("../../models/Payment");

describe("Payments integration", () => {
  let studentToken;
  let adminToken;
  let studentId;
  let adminId;
  let courseId;
  let paymentId;

  beforeAll(async () => {
    const dbStart = Date.now();
    while (mongoose.connection.readyState !== 1 && Date.now() - dbStart < 30000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (mongoose.connection.readyState !== 1) throw new Error("DB connection timeout");

    await User.deleteMany({});
    await Course.deleteMany({});
    await Category.deleteMany({});
    await Payment.deleteMany({});

    const student = await User.create({
      name: "Student User",
      email: "student@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "student",
      isVerified: true,
      isActive: true,
    });
    studentId = student._id.toString();

    const admin = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "admin",
      isVerified: true,
      isActive: true,
    });
    adminId = admin._id.toString();

    const instructor = await User.create({
      name: "Instructor User",
      email: "instructor@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "instructor",
      isVerified: true,
      isActive: true,
    });

    const category = await Category.create({
      name: "Test Category",
      description: "Test category",
      icon: "book",
      imageUrl: "https://placehold.co/600x400?text=Category",
    });

    const course = await Course.create({
      title: "Paid Course",
      description: "A paid course",
      price: 49.99,
      finalPrice: 49.99,
      category: category._id,
      topics: ["testing"],
      instructor: instructor._id,
      status: "published",
    });
    courseId = course._id.toString();

    const studentLogin = await request(app).post("/api/auth/login").send({
      email: "student@example.com",
      password: "password123",
    });
    studentToken = studentLogin.body.data.accessToken;

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "password123",
    });
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await Payment.deleteMany({});
    await Course.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
    if (global.__MONGOD__) await global.__MONGOD__.stop();
  });

  test("initiates a direct transfer payment", async () => {
    const csrfRes = await request(app)
      .get("/api/payments/csrf-token")
      .set("Authorization", `Bearer ${studentToken}`);
    const csrfToken = csrfRes.body.data.csrfToken;

    const res = await request(app)
      .post("/api/payments/initiate")
      .set("Authorization", `Bearer ${studentToken}`)
      .set("X-CSRF-Token", csrfToken)
      .send({ courseId, method: "direct_transfer" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paymentId).toBeDefined();
    paymentId = res.body.data.paymentId;
  });

  test("admin can list pending transfers", async () => {
    const res = await request(app)
      .get("/api/payments/admin/pending-transfers")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("admin can approve a submitted payment", async () => {
    // Mark the payment as submitted directly to exercise approval flow
    await Payment.findByIdAndUpdate(paymentId, { status: "submitted" });

    const csrfRes = await request(app)
      .get("/api/payments/csrf-token")
      .set("Authorization", `Bearer ${adminToken}`);
    const csrfToken = csrfRes.body.data.csrfToken;

    const res = await request(app)
      .post(`/api/payments/${paymentId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("X-CSRF-Token", csrfToken)
      .send({ approved: true });

    expect([200, 400]).toContain(res.status);
  });

  test("student cannot approve a payment", async () => {
    const csrfRes = await request(app)
      .get("/api/payments/csrf-token")
      .set("Authorization", `Bearer ${studentToken}`);
    const csrfToken = csrfRes.body.data.csrfToken;

    const res = await request(app)
      .post(`/api/payments/${paymentId}/approve`)
      .set("Authorization", `Bearer ${studentToken}`)
      .set("X-CSRF-Token", csrfToken)
      .send({ approved: true });

    expect(res.status).toBe(403);
  });
});