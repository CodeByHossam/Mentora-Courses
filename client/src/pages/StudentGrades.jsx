import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Star,
  BookOpen,
  User,
  Calendar,
  TrendingUp,
  Award,
  AlertCircle,
  Filter,
  Download,
  BarChart3,
  Target,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap
} from "lucide-react";
import { format } from "date-fns";
import { useGetAllStudentGradesQuery } from "../store/services/gradeApi";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";

const StudentGrades = () => {
  const { user } = useSelector((state) => state.auth);
  const [filterCourse, setFilterCourse] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Get student grades from API
  const {
    data: gradesData,
    isLoading,
    error,
    refetch
  } = useGetAllStudentGradesQuery();

  const courseGrades = gradesData?.data?.courseGrades || [];
  const overallGPA = gradesData?.data?.overallGPA || 0;
  const totalCourses = gradesData?.data?.totalCourses || 0;

  // Get unique courses for filtering
  const courses = courseGrades.map(cg => cg.course).filter(Boolean);

  // Filter and sort course grades
  const filteredCourseGrades = courseGrades
    .filter(cg => filterCourse === "all" || cg.course._id === filterCourse)
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          const aDate = a.finalGrade?.gradedAt || a.testGrades[0]?.gradedAt || 0;
          const bDate = b.finalGrade?.gradedAt || b.testGrades[0]?.gradedAt || 0;
          return new Date(bDate) - new Date(aDate);
        case "oldest":
          const aOldDate = a.finalGrade?.gradedAt || a.testGrades[0]?.gradedAt || 0;
          const bOldDate = b.finalGrade?.gradedAt || b.testGrades[0]?.gradedAt || 0;
          return new Date(aOldDate) - new Date(bOldDate);
        case "highest":
          const aGrade = a.finalGrade?.finalGrade?.percentage || a.summary?.testAverage || 0;
          const bGrade = b.finalGrade?.finalGrade?.percentage || b.summary?.testAverage || 0;
          return bGrade - aGrade;
        case "lowest":
          const aLowGrade = a.finalGrade?.finalGrade?.percentage || a.summary?.testAverage || 0;
          const bLowGrade = b.finalGrade?.finalGrade?.percentage || b.summary?.testAverage || 0;
          return aLowGrade - bLowGrade;
        default:
          return 0;
      }
    });

  // Helper functions
  const getGradeColor = (grade) => {
    if (grade >= 90) return "text-green-600 bg-green-100";
    if (grade >= 80) return "text-blue-600 bg-blue-100";
    if (grade >= 70) return "text-yellow-600 bg-yellow-100";
    if (grade >= 60) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const formatDate = (date) => {
    return date ? format(new Date(date), 'MMM dd, yyyy') : 'Not graded';
  };

  // Handle answer key download for students
  const handleDownloadAnswerKey = async (courseId, testId) => {
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
          toast.success('Answer key downloaded successfully!');
        } else {
          toast.error(data.message || 'Failed to download answer key');
        }
      } else if (response.status === 403) {
        toast.error('You must complete and receive a grade for this test before downloading the answer key');
      } else if (response.status === 404) {
        toast.error('Answer key not available for this test');
      } else {
        toast.error('Failed to download answer key');
      }
    } catch (error) {
      console.error('Error downloading answer key:', error);
      toast.error('Failed to download answer key');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Grades</h3>
            <p className="text-red-600 mb-4">{error?.data?.message || "Failed to load grades"}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StudentGrades;
