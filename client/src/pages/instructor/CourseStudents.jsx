import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Mail, Calendar, BookOpen, User } from "lucide-react";
import { useGetCourseStudentsQuery } from "../../store/services/courseApi";
import { ProgressLoader } from "../../components/common";
import { handleApiError } from "../../utils/apiErrorHandler";
const CourseStudents = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: courseData,
    isLoading,
    error,
  } = useGetCourseStudentsQuery(courseId);
  const filteredStudents = courseData?.students?.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ProgressLoader isVisible={true} message="Loading course students..." />
      </div>
    );
  }
  if (error) {
    handleApiError(error);
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">
            {error.data?.message || "Failed to load course students"}
          </p>
          <button
            onClick={() => navigate("/admin/manage-courses")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }
  return null;
};

export default CourseStudents;
