import React from "react";

const StudentGradesView = (props) => {
  return (
    <>
  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 My Grades
          </h1>
          <p className="text-gray-600">
            Track your academic performance and progress across all courses
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Overall GPA */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall GPA</p>
                <p className="text-2xl font-bold text-green-600">{overallGPA.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Courses */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-blue-600">{totalCourses}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Courses with Final Grades */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Final Grades</p>
                <p className="text-2xl font-bold text-purple-600">
                  {courseGrades.filter(cg => cg.finalGrade).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total Tests */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-orange-600">
                  {courseGrades.reduce((sum, cg) => sum + (cg.testGrades?.length || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Course
              </label>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Grade</option>
                <option value="lowest">Lowest Grade</option>
              </select>
            </div>
          </div>
        </div>

        {/* Course Grades */}
        <div className="space-y-6">
          {filteredCourseGrades.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Grades Yet</h3>
              <p className="text-gray-600">
                Your grades will appear here once your instructors start grading your work.
              </p>
            </div>
          ) : (
            filteredCourseGrades.map((courseGrade) => (
              <div key={courseGrade.course._id} className="bg-white rounded-xl p-6 shadow-lg">
                {/* Course Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {courseGrade.course.title}
                      </h3>
                      <p className="text-gray-600 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Instructor: {courseGrade.instructor?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Final Grade Display */}
                  {courseGrade.finalGrade && (
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                        getGradeColor(courseGrade.finalGrade.finalGrade.percentage)
                      }`}>
                        <Award className="w-5 h-5" />
                        <span className="font-bold text-lg">
                          {courseGrade.finalGrade.finalGrade.letter}
                        </span>
                        <span className="text-sm">
                          ({courseGrade.finalGrade.finalGrade.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        GPA: {courseGrade.finalGrade.finalGrade.gpa.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Test Grades */}
                {courseGrade.testGrades && courseGrade.testGrades.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Test Grades ({courseGrade.testGrades.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courseGrade.testGrades.map((testGrade) => (
                        <div key={testGrade._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">
                              {testGrade.testGrade.testName}
                            </h5>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              getGradeColor(testGrade.testGrade.percentage)
                            }`}>
                              {testGrade.testGrade.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              Score: {testGrade.testGrade.earnedPoints}/{testGrade.testGrade.totalPoints} points
                            </p>
                            <p>
                              Weight: {testGrade.testGrade.weight}%
                            </p>
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(testGrade.gradedAt)}
                            </p>
                          </div>
                          {testGrade.feedback && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                              <strong>Feedback:</strong> {testGrade.feedback}
                            </div>
                          )}

                          {/* Download Answer Key Button */}
                          <div className="mt-3">
                            <button
                              onClick={() => handleDownloadAnswerKey(courseGrade.course._id, testGrade.testGrade.testId)}
                              className="btn-primary flex items-center gap-2 text-sm w-full justify-center"
                              title="Download answer key (available after completing test)"
                            >
                              <Download className="w-4 h-4" />
                              Download Answer Key
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Test Average */}
                    {courseGrade.summary?.testAverage && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Test Average:</strong> {courseGrade.summary.testAverage.toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Comments/Feedback */}
                {courseGrade.finalGrade?.feedback && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Instructor Feedback:</h5>
                    <p className="text-blue-800">{courseGrade.finalGrade.feedback}</p>
                  </div>
                )}

                {/* No grades message */}
                {!courseGrade.finalGrade && (!courseGrade.testGrades || courseGrade.testGrades.length === 0) && (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No grades available for this course yet.</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default StudentGradesView;
