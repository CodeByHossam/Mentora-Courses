import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Save,
  X,
  User,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import {
  useGetCourseGradesQuery,
  useCreateTestGradeMutation,
} from "../store/services/gradeApi";
import {
  useUploadAnswerKeyMutation,
  useGetCourseInteractionsQuery,
} from "../store/services/courseInteractionApi";
import { useGetCourseQuery, useGetCourseStudentsQuery } from "../store/services/courseApi";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";

const TestGrading = () => {
  const { courseId, testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // Get test info from navigation state
  const testInfo = location.state || {};
  const { courseName, testName, testType, totalPoints } = testInfo;

  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAnswerKeyModal, setShowAnswerKeyModal] = useState(false);
  const [answerKeyFile, setAnswerKeyFile] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    earnedPoints: "",
    comments: "",
    feedback: "",
  });

  // Get course details and grades
  const {
    data: courseData,
    isLoading: courseLoading,
  } = useGetCourseQuery(courseId);

  const {
    data: studentsData,
    isLoading: studentsLoading,
  } = useGetCourseStudentsQuery(courseId);
  const {
    data: gradesData,
    isLoading: gradesLoading,
    refetch: refetchGrades,
  } = useGetCourseGradesQuery(courseId);

  const {
    data: courseInteractionsData,
    isLoading: interactionsLoading,
  } = useGetCourseInteractionsQuery(courseId);

  // Mutations
  const [createTestGrade, { isLoading: creatingGrade }] = useCreateTestGradeMutation();
  const [uploadAnswerKey, { isLoading: uploadingAnswerKey }] = useUploadAnswerKeyMutation();

  const course = courseData?.data || {};
  const enrolledStudents = studentsData?.students || [];
  const courseGrades = gradesData?.data || {};
  const studentGrades = courseGrades.studentGrades || [];
  
  // Find current test from course interactions
  const courseInteractions = courseInteractionsData || {};
  const tests = courseInteractions.tests || [];
  const currentTest = tests.find(test => test._id === testId);
  const hasAnswerKey = currentTest?.answerKey;


  // Filter students who have grades for this specific test
  const studentsWithTestGrades = studentGrades.filter(studentGrade => 
    studentGrade.testGrades?.some(grade => 
      grade.testGrade?.testId === testId
    )
  );


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

  const getStudentTestGrade = (studentId) => {
    const studentGrade = studentGrades.find(sg => sg.student._id === studentId);
    if (!studentGrade) return null;
    
    return studentGrade.testGrades?.find(grade => 
      grade.testGrade?.testId === testId
    );
  };

  // Handle grade submission
  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const earnedPoints = parseFloat(gradeForm.earnedPoints);
    const maxPoints = totalPoints || 100;

    if (isNaN(earnedPoints) || earnedPoints < 0 || earnedPoints > maxPoints) {
      toast.error(`Earned points must be between 0 and ${maxPoints}`);
      return;
    }

    try {
      await createTestGrade({
        studentId: selectedStudent._id,
        courseId: courseId,
        testId: testId,
        totalPoints: maxPoints,
        earnedPoints: earnedPoints,
        comments: gradeForm.comments,
        feedback: gradeForm.feedback,
      }).unwrap();

      toast.success("Grade added successfully!");
      setShowGradeModal(false);
      setGradeForm({
        earnedPoints: "",
        comments: "",
        feedback: "",
      });
      setSelectedStudent(null);
      refetchGrades();
    } catch (error) {
      console.error("Error creating grade:", error);
      toast.error(error?.data?.message || "Failed to add grade");
    }
  };

  const openGradeModal = (student) => {
    const existingGrade = getStudentTestGrade(student._id);
    
    setSelectedStudent(student);
    setGradeForm({
      earnedPoints: existingGrade?.testGrade?.earnedPoints?.toString() || "",
      comments: existingGrade?.comments || "",
      feedback: existingGrade?.feedback || "",
    });
    setShowGradeModal(true);
  };

  // Handle answer key upload
  const handleAnswerKeyUpload = async () => {
    if (!answerKeyFile) {
      toast.error("Please select an answer key file");
      return;
    }

    try {
      await uploadAnswerKey({
        courseId,
        testId,
        answerKeyFile,
      }).unwrap();

      toast.success("Answer key uploaded successfully!");
      setShowAnswerKeyModal(false);
      setAnswerKeyFile(null);
    } catch (error) {
      console.error("Error uploading answer key:", error);
      toast.error(error?.data?.message || "Failed to upload answer key");
    }
  };

  // Handle answer key download
  const handleAnswerKeyDownload = async () => {
    if (hasAnswerKey) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/course-interactions/${courseId}/tests/${testId}/answer-key/download`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const fullDownloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${data.data.downloadUrl}`;
            window.open(fullDownloadUrl, '_blank');
          } else {
            toast.error(data.message || 'Failed to download answer key');
          }
        } else {
          toast.error('Failed to download answer key');
        }
      } catch (error) {
        console.error('Error downloading answer key:', error);
        toast.error('Failed to download answer key');
      }
    }
  };

  if (courseLoading || studentsLoading || gradesLoading || interactionsLoading) return <LoadingSpinner />;

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
};

export default TestGrading;
