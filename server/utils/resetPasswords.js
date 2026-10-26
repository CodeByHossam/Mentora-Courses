const logger = require('./logger');
/**
 * Password Reset Utility
 *
 * This script properly hashes and updates passwords for admin and instructor accounts
 * Run this script to fix the password security issue
 */

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

/**
 * Hash password with bcrypt using secure salt rounds
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
};

/**
 * Reset passwords for admin and instructor accounts
 */
const resetPasswords = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("✅ Connected to MongoDB");

    // Define correct passwords
    const passwords = {
      admin: "123456",
      instructor: "123456", // You can change this to a different password
    };

    // Hash passwords
    const hashedAdminPassword = await hashPassword(passwords.admin);
    const hashedInstructorPassword = await hashPassword(passwords.instructor);

    logger.info("🔐 Hashing passwords...");

    // Update admin password
    const adminResult = await User.updateMany(
      { role: "admin" },
      {
        password: hashedAdminPassword,
        isVerified: true,
        isActive: true,
      }
    );

    // Update instructor password
    const instructorResult = await User.updateMany(
      { role: "instructor" },
      {
        password: hashedInstructorPassword,
        isVerified: true,
        isActive: true,
      }
    );

    logger.info(`✅ Updated ${adminResult.modifiedCount} admin account(s)`);
    logger.info(
      `✅ Updated ${instructorResult.modifiedCount} instructor account(s)`
    );

    // Verify the passwords work
    logger.info("\n🔍 Verifying passwords...");

    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
      const adminPasswordValid = await bcrypt.compare(
        passwords.admin,
        adminUser.password
      );
      logger.info(
        `Admin password validation: ${
          adminPasswordValid ? "✅ VALID" : "❌ INVALID"
        }`
      );
    }

    const instructorUser = await User.findOne({ role: "instructor" });
    if (instructorUser) {
      const instructorPasswordValid = await bcrypt.compare(
        passwords.instructor,
        instructorUser.password
      );
      logger.info(
        `Instructor password validation: ${
          instructorPasswordValid ? "✅ VALID" : "❌ INVALID"
        }`
      );
    }

    logger.info("\n🎉 Password reset completed successfully!");
    logger.info("📋 Login credentials:");
    logger.info("   Admin: email + password '123456'");
    logger.info("   Instructor: email + password '123456'");
  } catch (error) {
    logger.error("❌ Error resetting passwords:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the script
resetPasswords();
