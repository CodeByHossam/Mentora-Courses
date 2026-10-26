const logger = require('../utils/logger');
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const connectDB = async () => {
  try {
    // Close any existing connection before opening a new one
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    let uri;
    if (process.env.NODE_ENV === "test") {
      // Use an isolated in-memory database for tests to avoid touching real data
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      global.__MONGOD__ = mongod;
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      uri = mongod.getUri();
    } else {
      uri =
        process.env.NODE_ENV === "production"
          ? process.env.MONGO_URI
          : process.env.MONGO_URI_LOCAL;
    }

    const conn = await mongoose.connect(uri);
    logger.info(
      `✅ MongoDB Connected: ${conn.connection.host} in ${process.env.NODE_ENV} mode`
    );
  } catch (error) {
    logger.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

// 🔔 Event listeners for connection states
mongoose.connection.on("connected", () => {
  logger.info("✅ Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  logger.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  logger.info("🔌 Mongoose disconnected");
});

// 🛑 Graceful shutdown when app is terminated
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  logger.info("🔴 MongoDB connection closed due to app termination");
  process.exit(0);
});

module.exports = connectDB;
