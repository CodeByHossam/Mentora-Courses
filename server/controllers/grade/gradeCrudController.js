const { createFinalGrade, deleteGrade } = require('./gradeFinalController');
const { createTestGrade } = require('./gradeTestController');

module.exports = {
  createFinalGrade,
  createTestGrade,
  deleteGrade,
};
