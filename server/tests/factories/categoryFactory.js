const Category = require("../../models/Category");

const createCategory = async (overrides = {}) => {
  const defaults = {
    name: `Test Category ${Date.now()}`,
    description: "Test category",
    icon: "book",
    imageUrl: "https://placehold.co/600x400?text=Category",
  };
  return Category.create({ ...defaults, ...overrides });
};

module.exports = { createCategory };