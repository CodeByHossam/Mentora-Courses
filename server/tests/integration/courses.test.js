process.env.NODE_ENV = "test";

const request = require("supertest");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const app = require("../../server");
const User = require("../../models/User");
const Course = require("../../models/Course");
const Category = require("../../models/Category");

describe("Courses integration", () => {
  let testCourseId;

  beforeAll(async () => {
    const dbStart = Date.now();
    while (mongoose.connection.readyState !== 1 && Date.now() - dbStart < 30000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (mongoose.connection.readyState !== 1) {
      throw new Error("DB connection timeout");
    }
    await User.deleteMany({});
    await Course.deleteMany({});
    await Category.deleteMany({});

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
      title: "Published Test Course",
      description: "A published course for integration tests",
      price: 49.99,
      finalPrice: 49.99,
      category: category._id,
      topics: ["testing"],
      instructor: instructor._id,
      status: "published",
    });
    testCourseId = course._id.toString();
  });

  afterAll(async () => {
    await Course.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
    if (global.__MONGOD__) {
      await global.__MONGOD__.stop();
    }
  });

  test("lists published courses", async () => {
    const response = await request(app).get("/api/courses");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test("gets a course by id", async () => {
    const response = await request(app).get(`/api/courses/${testCourseId}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(testCourseId);
  });

  test("returns 404 for unknown course", async () => {
    const response = await request(app).get("/api/courses/507f1f77bcf86cd799439011");
    expect([404, 400]).toContain(response.status);
  });

  test("health check is healthy", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});