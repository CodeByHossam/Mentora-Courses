process.env.NODE_ENV = "test";

jest.mock("../../utils/emailSender", () => jest.fn().mockResolvedValue(true));

const request = require("supertest");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const app = require("../../server");
const User = require("../../models/User");

describe("Auth integration", () => {
  let authToken;
  const email = "auth-test@example.com";
  const password = "Password123!";

  beforeAll(async () => {
    const dbStart = Date.now();
    while (mongoose.connection.readyState !== 1 && Date.now() - dbStart < 30000) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (mongoose.connection.readyState !== 1) {
      throw new Error("DB connection timeout");
    }
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
    if (global.__MONGOD__) {
      await global.__MONGOD__.stop();
    }
  });

  test("registers a new user", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Auth Test User",
      email,
      password,
      termsAccepted: true,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
  });

  test("rejects duplicate registration", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Auth Test User",
      email,
      password,
      termsAccepted: true,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects registration without required fields", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "missing-fields@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("rejects login with invalid password", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email,
      password: "WrongPassword123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("rejects login for unverified user in test mode", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(403);
  });

  test("logs in after manual verification", async () => {
    await User.updateOne({ email }, { isVerified: true, isActive: true });

    const response = await request(app).post("/api/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    authToken = response.body.data.accessToken;
  });

  test("gets current user with token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(email);
  });

  test("rejects current user without token", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });

  test("updates profile name", async () => {
    const response = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Updated Auth User" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.name).toBe("Updated Auth User");
  });
});