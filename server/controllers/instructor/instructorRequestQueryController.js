const InstructorRequest = require("../../models/InstructorRequestModel");
const asyncHandler = require("express-async-handler");

const getRequests = asyncHandler(async (req, res) => {
  const requests = await InstructorRequest.find().populate(
    "user",
    "name email"
  );
  res.json({ isSuccess: true, data: requests });
});

// @desc    Update instructor request (approve or reject)
// @route   PUT /api/instructor-requests/:id
// @access  Admin

module.exports = {
  getRequests
};
