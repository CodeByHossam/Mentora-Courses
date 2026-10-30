import React from "react";

const TestGradingView = (props) => {
  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary hover:text-primary-dark mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Course
          </button>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-xl shadow-lg">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Grade Test: {testName}
                </h1>
                <p className="text-gray-600">
                  {courseName} • {testType === 'final' ? '🎯 Final Test' : '📝 Progress Test'} • Max Points: {totalPoints || 100}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasAnswerKey ? (
                <>
                  <button
                    onClick={handleAnswerKeyDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    <Download className="w-5 h-5" />
                    Download Answer Key
                  </button>
                  <button
                    onClick={() => setShowAnswerKeyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Update Answer Key
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                    <p className="text-yellow-800 text-sm font-medium">
                      ⚠️ No answer key uploaded yet
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAnswerKeyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Upload Answer Key
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{enrolledStudents.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Graded</p>
                  <p className="text-2xl font-bold text-gray-900">{studentsWithTestGrades.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enrolledStudents.length - studentsWithTestGrades.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Max Points</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPoints || 100}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Students Enrolled in Course
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Letter Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrolledStudents.map((student) => {
                  if (!student) return null;

                  const testGrade = getStudentTestGrade(student._id);

                  const earnedPoints = testGrade?.testGrade?.earnedPoints || 0;
                  const maxPoints = totalPoints || 100;
                  const percentage = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;

                  return (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {student.name?.charAt(0) || 'S'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {testGrade ? `${earnedPoints}/${maxPoints}` : 'Not graded'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {testGrade ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(percentage)}`}>
                            {percentage}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {testGrade ? (
                          <span className="text-sm font-medium text-gray-900">
                            {getLetterGrade(percentage)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openGradeModal(student)}
                          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {testGrade ? 'Edit Grade' : 'Add Grade'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grade Modal */}
        {showGradeModal && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowGradeModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Add Grade</h3>
                </div>
                <p className="text-gray-600">
                  {selectedStudent.name} • {testName}
                </p>
              </div>

              <form onSubmit={handleGradeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Earned Points (out of {totalPoints || 100}) *
                  </label>
                  <input
                    type="number"
                    value={gradeForm.earnedPoints}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, earnedPoints: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter points earned"
                    min="0"
                    max={totalPoints || 100}
                    step="0.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments
                  </label>
                  <textarea
                    value={gradeForm.comments}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, comments: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add comments about the grade..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback
                  </label>
                  <textarea
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Provide feedback to the student..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowGradeModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingGrade}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {creatingGrade ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Grade
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Answer Key Upload Modal */}
        {showAnswerKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowAnswerKeyModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Upload Answer Key</h3>
                </div>
                <p className="text-gray-600">
                  Upload the answer key for {testName}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer Key File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setAnswerKeyFile(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.ppt,.pptx"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, DOC, DOCX, TXT, Images, ZIP, PPT
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAnswerKeyModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAnswerKeyUpload}
                    disabled={uploadingAnswerKey || !answerKeyFile}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center justify-center gap-2"
                  >
                    {uploadingAnswerKey ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Upload Answer Key
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  );
};

export default TestGradingView;
