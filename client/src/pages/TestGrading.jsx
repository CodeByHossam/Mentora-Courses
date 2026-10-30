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

  return <TestGradingView />;
};

export default TestGrading;
