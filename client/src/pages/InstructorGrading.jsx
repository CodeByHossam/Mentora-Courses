import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  BookOpen,
  Users,
  Plus,
  Edit3,
  Save,
  X,
  Calculator,
  Award,
  Target,
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  useGetCourseGradesQuery,
  useGetCourseTestsQuery,
  useCreateTestGradeMutation,
  useCreateFinalGradeMutation,
  useDeleteGradeMutation,
} from "../store/services/gradeApi";
import { useGetInstructorCoursesQuery } from "../store/services/courseApi";
import LoadingSpinner from "../components/LoadingSpinner";

const InstructorGrading = () => {
  const { user } = useSelector((state) => state.auth);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showTestGradeModal, setShowTestGradeModal] = useState(false);
  const [showFinalGradeModal, setShowFinalGradeModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [testGradeForm, setTestGradeForm] = useState({
    testId: "",
    totalPoints: "",
    earnedPoints: "",
    comments: "",
    feedback: "",
  });
  const [finalGradeForm, setFinalGradeForm] = useState({
    percentage: "",
    comments: "",
    feedback: "",
  });

  // Get instructor's courses
  const { data: coursesData, isLoading: coursesLoading } =
    useGetInstructorCoursesQuery(user.id);

  // Get grades for selected course
  const {
    data: gradesData,
    isLoading: gradesLoading,
    refetch: refetchGrades,
  } = useGetCourseGradesQuery(selectedCourse, {
    skip: !selectedCourse,
  });

  // Get tests for selected course
  const {
    data: testsData,
    isLoading: testsLoading,
  } = useGetCourseTestsQuery(selectedCourse, {
    skip: !selectedCourse,
  });

  // Mutations
  const [createTestGrade, { isLoading: creatingTestGrade }] =
    useCreateTestGradeMutation();
  const [createFinalGrade, { isLoading: creatingFinalGrade }] =
    useCreateFinalGradeMutation();
  const [deleteGrade] = useDeleteGradeMutation();

  const courses = coursesData || [];
  const courseGrades = gradesData?.data || {};
  const studentGrades = courseGrades.studentGrades || [];
  const statistics = courseGrades.statistics || [];
  const courseTests = testsData?.data || {};
  const tests = courseTests.tests || [];
  const progressTests = courseTests.progressTests || [];
  const finalTests = courseTests.finalTests || [];

  // Helper functions
  const getLetterGrade = (percentage) => {
    if (percentage >= 97) return "A+";
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 60) return "D";
    return "F";
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "text-green-600 bg-green-100";
    if (percentage >= 80) return "text-blue-600 bg-blue-100";
    if (percentage >= 70) return "text-yellow-600 bg-yellow-100";
    if (percentage >= 60) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const calculateWeightedAverage = (testGrades) => {
    if (!testGrades || testGrades.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    testGrades.forEach((grade) => {
      const weight = grade.testGrade.weight || 1;
      totalWeightedScore += grade.testGrade.percentage * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  };

  // Handle test grade submission
  const handleTestGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !testGradeForm.testId) return;

    try {
      await createTestGrade({
        studentId: selectedStudent.student._id,
        courseId: selectedCourse,
        testId: testGradeForm.testId,
        totalPoints: parseFloat(testGradeForm.totalPoints),
        earnedPoints: parseFloat(testGradeForm.earnedPoints),
        comments: testGradeForm.comments,
        feedback: testGradeForm.feedback,
      }).unwrap();

      setShowTestGradeModal(false);
      setTestGradeForm({
        testId: "",
        totalPoints: "",
        earnedPoints: "",
        comments: "",
        feedback: "",
      });
      refetchGrades();
    } catch (error) {
      console.error("Error creating test grade:", error);
    }
  };

  // Handle final grade submission
  const handleFinalGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      await createFinalGrade({
        studentId: selectedStudent.student._id,
        courseId: selectedCourse,
        percentage: parseFloat(finalGradeForm.percentage),
        comments: finalGradeForm.comments,
        feedback: finalGradeForm.feedback,
      }).unwrap();

      setShowFinalGradeModal(false);
      setFinalGradeForm({
        percentage: "",
        comments: "",
        feedback: "",
      });
      refetchGrades();
    } catch (error) {
      console.error("Error creating final grade:", error);
    }
  };

  if (coursesLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Grade Management
          </h1>
          <p className="text-gray-600">
            Assign test grades and final course grades for your students
          </p>
        </div>

        {/* Course Selection */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <div className="flex items-center gap-4">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course to Grade
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Course Statistics */}
        {selectedCourse && statistics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statistics.map((stat) => (
              <div key={stat._id} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {stat._id.replace("_", " ")} Grades
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.count}
                    </p>
                    <p className="text-sm text-gray-500">
                      Avg: {stat.averagePercentage?.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    {stat._id === "final_grade" ? (
                      <Award className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Target className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Students and Grades */}
        {selectedCourse && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Student Grades ({studentGrades.length})
                </h2>
              </div>
            </div>

            {gradesLoading ? (
              <div className="p-8">
                <LoadingSpinner />
              </div>
            ) : studentGrades.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Students Enrolled
                </h3>
                <p className="text-gray-600">
                  Students will appear here once they enroll in this course.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {studentGrades.map((studentGrade) => {
                  const testAverage = calculateWeightedAverage(
                    studentGrade.testGrades
                  );
                  const finalGrade = studentGrade.finalGrade;

                  return (
                    <div key={studentGrade.student._id} className="p-6">
                      {/* Student Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {studentGrade.student.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {studentGrade.student.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {studentGrade.student.email}
                            </p>
                          </div>
                        </div>

                        {/* Final Grade Display */}
                        <div className="flex items-center gap-4">
                          {finalGrade ? (
                            <div
                              className={`px-4 py-2 rounded-lg ${getGradeColor(
                                finalGrade.finalGrade.percentage
                              )}`}
                            >
                              <span className="font-bold">
                                {finalGrade.finalGrade.letter}
                              </span>
                              <span className="text-sm ml-1">
                                ({finalGrade.finalGrade.percentage.toFixed(1)}%)
                              </span>
                            </div>
                          ) : testAverage > 0 ? (
                            <div
                              className={`px-4 py-2 rounded-lg border-2 border-dashed ${getGradeColor(
                                testAverage
                              )
                                .replace("bg-", "border-")
                                .replace("-100", "-300")}`}
                            >
                              <span className="font-medium">
                                Test Avg: {testAverage.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600">
                              <span>No grades yet</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Test Grades */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Test Grades ({studentGrade.testGrades?.length || 0})
                        </h4>

                        {studentGrade.testGrades &&
                        studentGrade.testGrades.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                            {studentGrade.testGrades.map((testGrade) => (
                              <div
                                key={testGrade._id}
                                className="border border-gray-200 rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-sm">
                                    {testGrade.testGrade.testName}
                                  </h5>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(
                                      testGrade.testGrade.percentage
                                    )}`}
                                  >
                                    {testGrade.testGrade.percentage.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                  <p>
                                    Score: {testGrade.testGrade.earnedPoints}/
                                    {testGrade.testGrade.totalPoints} points
                                  </p>
                                  <p>Weight: {testGrade.testGrade.weight}%</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mb-3">
                            No test grades assigned yet
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedStudent(studentGrade);
                            setShowTestGradeModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Test Grade
                        </button>

                        <button
                          onClick={() => {
                            setSelectedStudent(studentGrade);
                            setFinalGradeForm({
                              percentage: finalGrade
                                ? finalGrade.finalGrade.percentage.toString()
                                : testAverage.toFixed(1),
                              comments: finalGrade?.comments || "",
                              feedback: finalGrade?.feedback || "",
                            });
                            setShowFinalGradeModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Award className="w-4 h-4" />
                          {finalGrade ? "Update" : "Assign"} Final Grade
                        </button>

                        {testAverage > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calculator className="w-4 h-4" />
                            Suggested: {getLetterGrade(testAverage)} (
                            {testAverage.toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Test Grade Modal */}
        {showTestGradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add Test Grade
                </h3>
                <button
                  onClick={() => setShowTestGradeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTestGradeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={testGradeForm.testName}
                    onChange={(e) =>
                      setTestGradeForm({
                        ...testGradeForm,
                        testName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Midterm Exam, Quiz 1"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Points *
                    </label>
                    <input
                      type="number"
                      value={testGradeForm.totalPoints}
                      onChange={(e) =>
                        setTestGradeForm({
                          ...testGradeForm,
                          totalPoints: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="100"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Earned Points *
                    </label>
                    <input
                      type="number"
                      value={testGradeForm.earnedPoints}
                      onChange={(e) =>
                        setTestGradeForm({
                          ...testGradeForm,
                          earnedPoints: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="85"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (% of final grade)
                  </label>
                  <input
                    type="number"
                    value={testGradeForm.weight}
                    onChange={(e) =>
                      setTestGradeForm({
                        ...testGradeForm,
                        weight: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments
                  </label>
                  <input
                    type="text"
                    value={testGradeForm.comments}
                    onChange={(e) =>
                      setTestGradeForm({
                        ...testGradeForm,
                        comments: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief comment about performance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Feedback
                  </label>
                  <textarea
                    value={testGradeForm.feedback}
                    onChange={(e) =>
                      setTestGradeForm({
                        ...testGradeForm,
                        feedback: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Detailed feedback for the student..."
                  />
                </div>

                {/* Calculated Percentage Display */}
                {testGradeForm.totalPoints && testGradeForm.earnedPoints && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Calculated Grade:</strong>{" "}
                      {(
                        (parseFloat(testGradeForm.earnedPoints) /
                          parseFloat(testGradeForm.totalPoints)) *
                        100
                      ).toFixed(1)}
                      % (
                      {getLetterGrade(
                        (parseFloat(testGradeForm.earnedPoints) /
                          parseFloat(testGradeForm.totalPoints)) *
                          100
                      )}
                      )
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creatingTestGrade}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {creatingTestGrade ? "Saving..." : "Save Test Grade"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTestGradeModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Final Grade Modal */}
        {showFinalGradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assign Final Grade
                </h3>
                <button
                  onClick={() => setShowFinalGradeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFinalGradeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Final Grade Percentage *
                  </label>
                  <input
                    type="number"
                    value={finalGradeForm.percentage}
                    onChange={(e) =>
                      setFinalGradeForm({
                        ...finalGradeForm,
                        percentage: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="85.5"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments
                  </label>
                  <input
                    type="text"
                    value={finalGradeForm.comments}
                    onChange={(e) =>
                      setFinalGradeForm({
                        ...finalGradeForm,
                        comments: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Overall performance summary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Feedback
                  </label>
                  <textarea
                    value={finalGradeForm.feedback}
                    onChange={(e) =>
                      setFinalGradeForm({
                        ...finalGradeForm,
                        feedback: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="4"
                    placeholder="Comprehensive feedback about the student's performance in the course..."
                  />
                </div>

                {/* Grade Preview */}
                {finalGradeForm.percentage && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-800">
                          <strong>Letter Grade:</strong>{" "}
                          {getLetterGrade(
                            parseFloat(finalGradeForm.percentage)
                          )}
                        </p>
                        <p className="text-sm text-green-800">
                          <strong>GPA Points:</strong>{" "}
                          {(
                            {
                              "A+": 4.0,
                              A: 4.0,
                              "A-": 3.7,
                              "B+": 3.3,
                              B: 3.0,
                              "B-": 2.7,
                              "C+": 2.3,
                              C: 2.0,
                              "C-": 1.7,
                              "D+": 1.3,
                              D: 1.0,
                              F: 0.0,
                            }[
                              getLetterGrade(
                                parseFloat(finalGradeForm.percentage)
                              )
                            ] || 0.0
                          ).toFixed(1)}
                        </p>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-lg ${getGradeColor(
                          parseFloat(finalGradeForm.percentage)
                        )}`}
                      >
                        <span className="font-bold text-lg">
                          {getLetterGrade(
                            parseFloat(finalGradeForm.percentage)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creatingFinalGrade}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Award className="w-4 h-4" />
                    {creatingFinalGrade ? "Saving..." : "Save Final Grade"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFinalGradeModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorGrading;
