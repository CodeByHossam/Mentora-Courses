const {
  const {
  getAdminSummary,
  getStudentSummary,
  getInstructorSummary,
} = require("../services/financialSummaryService");

const { sendSuccess, sendError } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const getAdminFinancialSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await getAdminSummary({ from, to });
    return sendSuccess(res, data, "Admin financial summary retrieved");
  } catch (error) {
    logger.error("Admin financial summary failed", { error: error.message });
    return sendError(res, error.message || "Failed to retrieve summary", 500);
  }
};

const getStudentFinancialSummary = async (req, res) => {
  try {
    const data = await getStudentSummary(req.user.id);
    return sendSuccess(res, data, "Student financial summary retrieved");
  } catch (error) {
    logger.error("Student financial summary failed", { error: error.message });
    return sendError(res, error.message || "Failed to retrieve summary", 500);
  }
};

const getInstructorFinancialSummary = async (req, res) => {
  try {
    const data = await getInstructorSummary(req.user.id);
    return sendSuccess(res, data, "Instructor financial summary retrieved");
  } catch (error) {
    logger.error("Instructor financial summary failed", { error: error.message });
    return sendError(res, error.message || "Failed to retrieve summary", 500);
  }
};

module.exports = {
  getAdminFinancialSummary,
  getStudentFinancialSummary,
  getInstructorFinancialSummary,
};
