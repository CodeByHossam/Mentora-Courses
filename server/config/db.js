const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const connectDB = async () => {
  try {
    // Close all connections before starting a new one
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("🔌 Previous MongoDB connection closed");
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(
      process.env.NODE_ENV == "production"
        ? process.env.MONGO_URI
        : process.env.MONGO_URI_LOCAL
    );

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host} in ${process.env.NODE_ENV} mode`
    );
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

// 🔔 Event listeners for connection states
mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 Mongoose disconnected");
});

// 🛑 Graceful shutdown when app is terminated
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("🔴 MongoDB connection closed due to app termination");
  process.exit(0);
});

module.exports = connectDB;
