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
} from "../../store/services/gradeApi";
import { useGetInstructorCoursesQuery } from "../../store/services/courseApi";
import { LoadingSpinner } from "../../components/common";

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

  return null;
};

export default InstructorGrading;
