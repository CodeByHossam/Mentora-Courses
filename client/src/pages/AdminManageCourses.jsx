import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import {
  useGetCoursesQuery,
  useGetAllCoursesQuery,
  useDeleteCourseMutation,
  useUpdateCourseStatusMutation,
} from "../store/services/courseApi";
import ProgressLoader from "../components/ProgressLoader";
import { handleApiError, handleApiSuccess } from "../utils/apiErrorHandler"; // ✅ your custom handlers
import { useConfirm } from "../hooks/useConfirm";

const AdminManageCourses = () => {
  const { confirm, ConfirmationModalWrapper } = useConfirm();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    data: courses,
    isLoading,
    error,
  } = useGetAllCoursesQuery(
    {
    },
    {
      refetchOnMountOrArgChange: true,
    }
    
  );
  const [deleteCourse] = useDeleteCourseMutation();
  const [updateCourseStatus] = useUpdateCourseStatusMutation();

  const handleDeleteCourse = async (courseId) => {
    const confirmed = await confirm({
      title: "Delete this item?",
      message: "This action cannot be undone.",
    });

    if (confirmed) {
      try {
        await deleteCourse(courseId).unwrap();
        handleApiSuccess("Course deleted successfully");
      } catch (error) {
        handleApiError(error, "Failed to delete course");
      }
    }
  };

  const handleStatusChange = async (courseId, newStatus) => {
    try {
      await updateCourseStatus({ courseId, status: newStatus }).unwrap();
      handleApiSuccess("Course status updated successfully");
    } catch (error) {
      handleApiError(error, "Failed to update course status");
    }
  };

  const filteredCourses = courses?.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ProgressLoader isVisible={true} message="Loading courses..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">
            {error.data?.message || "Failed to load courses"}
          </p>
        </div>
      </div>
    );
};
  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConfirmationModalWrapper />

        {/* Header Section */}
        <div className="card rounded-xl p-8 mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">
                📚 Manage Courses
              </h1>
              <p className="mt-2 text-secondary">
                View, edit, and manage all courses in the system
              </p>
              <div className="mt-4 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: 'var(--success)'}}></div>
                  <span className="text-sm text-secondary">
                    Total Courses: {courses?.data?.length || 0}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: 'var(--info)'}}></div>
                  <span className="text-sm text-secondary">
                    Filtered: {filteredCourses?.length || 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 sm:mt-0">
              <button
                onClick={() => navigate("/admin/courses/create")}
                className="btn-success inline-flex items-center px-6 py-3 rounded-xl shadow-lg text-sm font-medium transform transition-all duration-200 hover:scale-105"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create New Course
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="card rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-secondary mb-2">
                🔍 Search Courses
              </label>
              <input
                type="text"
                placeholder="Search by course title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg transition-all duration-200" 
                style={{borderColor: 'var(--card-border)'}} 
                onFocus={(e) => {e.target.style.borderColor = 'var(--success)'; e.target.style.outline = '2px solid var(--success)'; e.target.style.outlineOffset = '2px'}} 
                onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
              />
            </div>
            <div className="lg:w-64">
              <label className="block text-sm font-medium text-secondary mb-2">
                📊 Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg transition-all duration-200" 
                style={{borderColor: 'var(--card-border)'}} 
                onFocus={(e) => {e.target.style.borderColor = 'var(--success)'; e.target.style.outline = '2px solid var(--success)'; e.target.style.outlineOffset = '2px'}} 
                onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
              >
                <option value="all">All Status</option>
                <option value="draft">📝 Draft</option>
                <option value="published">✅ Published</option>
                <option value="archived">📦 Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-accent">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(!filteredCourses || filteredCourses.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-2xl font-bold text-primary mb-2">
                          No courses found
                        </h3>
                        <p className="text-secondary">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {filteredCourses?.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--accent)'}}>
                            <span className="text-sm font-medium text-primary">
                              {course.title?.charAt(0) || 'C'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-primary">
                            {course.title}
                          </div>
                          <div className="text-sm text-secondary">
                            {course.category?.name || 'Uncategorized'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary">
                        {course.instructor?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-secondary">
                        {course.instructor?.email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={course.status || 'draft'}
                        onChange={(e) => handleStatusChange(course._id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${
                          course.status === 'published' 
                            ? 'btn-success-status' 
                            : course.status === 'draft'
                            ? 'btn-warning-status'
                            : course.status === 'archived'
                            ? 'btn-secondary-status'
                            : 'btn-warning-status'
                        }`}
                      >
                        <option value="draft">📝 Draft</option>
                        <option value="published">✅ Published</option>
                        <option value="archived">📦 Archived</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                      {course.enrolledStudents?.length || 0} students
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/courses/${course._id}`)}
                          className="btn-info-outline text-xs px-3 py-1 rounded"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/admin/courses/edit/${course._id}`)}
                          className="btn-warning-outline text-xs px-3 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          className="btn-error-outline text-xs px-3 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManageCourses;
