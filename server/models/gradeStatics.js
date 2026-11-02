const mongoose = require("mongoose");

module.exports = function (schema) {
// Static method to get student's course summary
schema.statics.getStudentCourseSummary = async function (
  studentId,
  courseId
) {
  const grades = await this.find({
    studentId,
    courseId,
    status: "published",
  }).populate("testGrade.testId", "title testType");

  const finalGrade = grades.find((g) => g.gradeType === "final_grade");
  const testGrades = grades.filter((g) => g.gradeType === "test_grade");

  // Separate progress and final test grades
  const progressTests = testGrades.filter(
    (g) => g.testGrade.testType === "progress"
  );
  const finalTests = testGrades.filter((g) => g.testGrade.testType === "final");

  // Calculate progress tests average (simple average, no weights)
  let progressAverage = 0;
  if (progressTests.length > 0) {
    const totalPercentage = progressTests.reduce(
      (sum, grade) => sum + grade.testGrade.percentage,
      0
    );
    progressAverage =
      Math.round((totalPercentage / progressTests.length) * 100) / 100;
  }

  // Get final test result (should be only one)
  const finalTestResult =
    finalTests.length > 0 ? finalTests[0].testGrade.percentage : null;

  return {
    finalGrade: finalGrade || null,
    testGrades,
    progressTests,
    finalTests,
    progressAverage: progressTests.length > 0 ? progressAverage : null,
    finalTestResult,
    totalTests: testGrades.length,
    totalProgressTests: progressTests.length,
    totalFinalTests: finalTests.length,
  };
};

// Static method to get course grade statistics
schema.statics.getCourseStatistics = async function (courseId) {
  const pipeline = [
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId),
        status: "published",
      },
    },
    {
      $group: {
        _id: "$gradeType",
        count: { $sum: 1 },
        averagePercentage: {
          $avg: {
            $cond: {
              if: { $eq: ["$gradeType", "final_grade"] },
              then: "$finalGrade.percentage",
              else: "$testGrade.percentage",
            },
          },
        },
        grades: { $push: "$$ROOT" },
      },
    },
  ];

  return await this.aggregate(pipeline);
};
};
