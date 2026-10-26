const bcrypt = require("bcryptjs");
const User = require("../../models/User");

const createUser = async (overrides = {}) => {
  const defaults = {
    name: "Test User",
    email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: await bcrypt.hash("password123", 10),
    role: "student",
    isVerified: true,
    isActive: true,
  };
  return User.create({ ...defaults, ...overrides });
};

module.exports = { createUser };