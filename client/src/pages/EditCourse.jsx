import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetCourseQuery,
  useUpdateCourseMutation,
} from "../store/services/courseApi";
import { useGetCategoriesQuery } from "../store/services/categoryApi";
import { handleApiError, handleApiSuccess } from "../utils/apiErrorHandler";

const EditCourse = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    level: "Beginner",
  });

  const {
    data: course,
    isLoading,
    error,
  } = useGetCourseQuery(id, {
    skip: !id,
    refetchOnMountOrArgChange: true,
  });
  const { data: categories } = useGetCategoriesQuery();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        price: course.price || "",
        category: course.category?._id || course.category || "",
        level: course.level || "Beginner",
      });
    }
  }, [course, categories]);

  useEffect(() => {
    if (error) {
      handleApiError(error, () => {
        navigate("/instructor/courses");
      });
    }
  }, [error, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const selectedCategory = categories?.find(
        (cat) => cat._id === formData.category
      );

      const updateData = {
        ...formData,
        category: selectedCategory?._id || formData.category,
      };

      await updateCourse({ id, ...updateData }).unwrap();

      handleApiSuccess("Course updated successfully");
      navigate("/instructor/courses");
    } catch (error) {
      handleApiError(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(48,146,85)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center">
            <div className="text-6xl mb-4">✏️</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Edit Course
            </h1>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              Update your course information to keep it current and engaging for students
            </p>
            {course && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                📚 Editing: {course.title}
              </div>
            )}
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">📝</span>
              Course Details
            </h2>
            <p className="text-amber-100 text-sm mt-1">
              Update the information below to modify your course
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📖 Course Title
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter course title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📄 Course Description
              </label>
              <textarea
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what students will learn..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            {/* Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Price (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 w-full">
                  <div className="flex items-center text-amber-700">
                    <span className="text-2xl mr-2">💡</span>
                    <div>
                      <div className="text-sm font-medium">Pricing Tip</div>
                      <div className="text-xs">Consider your course value and market rates</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category and Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📂 Category
                </label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories?.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📈 Difficulty Level
                </label>
                <select
                  name="level"
                  required
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="Beginner">🌱 Beginner</option>
                  <option value="Intermediate">🚀 Intermediate</option>
                  <option value="Advanced">⚡ Advanced</option>
                </select>
              </div>
            </div>

            {/* Course Stats */}
            {course && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  📊 Course Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl text-blue-600 mb-2">👥</div>
                    <div className="text-sm text-gray-600">Enrolled Students</div>
                    <div className="font-semibold text-gray-900">
                      {course.enrolledStudents?.length || 0}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl text-green-600 mb-2">📚</div>
                    <div className="text-sm text-gray-600">Lessons</div>
                    <div className="font-semibold text-gray-900">
                      {course.lessons?.length || 0}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl text-purple-600 mb-2">📅</div>
                    <div className="text-sm text-gray-600">Created</div>
                    <div className="font-semibold text-gray-900">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/instructor/courses")}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                ← Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transform hover:scale-105 disabled:transform-none"
              >
                {isUpdating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving Changes...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">💾</span>
                    Save Changes
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCourse;
