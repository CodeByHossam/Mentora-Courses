const Course = require("../../models/Course");

const createCourse = async (instructorId, categoryId, overrides = {}) => {
  const defaults = {
    title: `Test Course ${Date.now()}`,
    description: "A test course",
    price: 49.99,
    finalPrice: 49.99,
    category: categoryId,
    topics: ["testing"],
    instructor: instructorId,
    status: "published",
  };
  return Course.create({ ...defaults, ...overrides });
};

module.exports = { createCourse };