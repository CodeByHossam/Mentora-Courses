import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useCreateCourseMutation } from "../store/services/courseApi";
import { handleApiError, handleApiSuccess } from "../utils/apiErrorHandler";
import { useGetCategoriesQuery } from "../store/services/categoryApi";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const CreateCourse = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: CATEGORIES, isLoading: categoriesLoading } =
    useGetCategoriesQuery();
  const navigate = useNavigate();

  const [createCourse] = useCreateCourseMutation();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
    category: "",
    level: "Beginner",
    topics: "",
    imageUrl: "",
  });

  const [imageFile, setImageFile] = useState(null);

  /** Handle normal inputs */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /** Handle file upload */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setFormData((prev) => ({ ...prev, imageUrl: "" })); // clear URL if file chosen
    }
  };

  /** Handle URL input */
  const handleUrlChange = (e) => {
    setFormData((prev) => ({ ...prev, imageUrl: e.target.value }));
    setImageFile(null); // clear file if URL entered
  };

  /** Submit form */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const courseData = new FormData();
      courseData.append("title", formData.title);
      courseData.append("description", formData.description);
      courseData.append("price", Number(formData.price));
      courseData.append("duration", Number(formData.duration));
      courseData.append("category", formData.category); // use ObjectId in dropdown
      courseData.append("level", formData.level);

      // topics as array
      const topicsArr = formData.topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      courseData.append("topics", JSON.stringify(topicsArr));

      // image file OR url
      if (imageFile) {
        courseData.append("imageFile", imageFile); // backend expects imageFile
      } else if (formData.imageUrl) {
        courseData.append("imageUrl", formData.imageUrl);
      }

      const result = await createCourse(courseData).unwrap();
      handleApiSuccess("Course created successfully");

      // Redirect after success
      if (user.role === "admin") {
        navigate("/admin/manage-courses");
      } else {
        navigate(`/courses/${result?.data?._id}`);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  /** Cancel */
  const handleCancel = () => {
    if (user.role === "admin") {
      navigate("/admin/manage-courses");
    } else {
      navigate("/instructor/courses");
    }
  };

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="card rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">✨</div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{background: 'linear-gradient(to right, var(--success), var(--info))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
              Create New Course
            </h1>
            <p className="mt-2 text-sm sm:text-base text-secondary max-w-2xl mx-auto">
              Share your knowledge with the world by creating an engaging and comprehensive course
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="card rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6" style={{background: 'linear-gradient(to right, var(--success), var(--info))'}}>
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">📚</span>
              Course Information
            </h2>
            <p className="text-white opacity-90 text-sm mt-1">
              Fill in the details to create your new course
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                📝 Course Title
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter an engaging course title..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg transition-all duration-200" style={{borderColor: 'var(--card-border)'}} onFocus={(e) => {e.target.style.borderColor = 'var(--primary)'; e.target.style.outline = '2px solid var(--primary)'; e.target.style.outlineOffset = '2px'}} onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                📄 Course Description
              </label>
              <textarea
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what students will learn in this course..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            {/* Price + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
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
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  ⏱️ Duration (hours)
                </label>
                <input
                  type="number"
                  name="duration"
                  min="1"
                  required
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Category + Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  📂 Category
                </label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select a category</option>
                  {!categoriesLoading &&
                    CATEGORIES?.map((cat) => (
                      <option key={cat?._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  📈 Difficulty Level
                </label>
                <select
                  name="level"
                  required
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl === 'Beginner' ? '🌱 Beginner' : 
                       lvl === 'Intermediate' ? '🚀 Intermediate' : 
                       '⚡ Advanced'} 
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Topics */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                🏷️ Course Topics
              </label>
              <input
                type="text"
                name="topics"
                required
                value={formData.topics}
                onChange={handleChange}
                placeholder="HTML, CSS, JavaScript, React, Node.js"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate topics with commas to help students find your course
              </p>
            </div>

            {/* Image Upload Section */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                🖼️ Course Image
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload file */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    📤 Upload Image File
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={!!formData.imageUrl}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  {formData.imageUrl && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      File upload disabled - remove URL to upload file
                    </p>
                  )}
                </div>
                
                {/* Or URL */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    🔗 Or Enter Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={handleUrlChange}
                    placeholder="https://example.com/course-image.jpg"
                    disabled={!!imageFile}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {imageFile && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      URL input disabled - remove file to enter URL
                    </p>
                  )}
                </div>
              </div>
              
              {/* Image Preview */}
              {(imageFile || formData.imageUrl) && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                  <div className="relative inline-block">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl}
                      alt="Course preview"
                      className="w-48 h-32 object-cover rounded-lg shadow-md border-2 border-emerald-200"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                      ✓ Preview
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                ← Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transform hover:scale-105 disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Course...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🚀</span>
                    Create Course
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

export default CreateCourse;
