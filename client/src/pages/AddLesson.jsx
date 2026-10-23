import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCreateLessonMutation } from "../store/services/lessonApi";
import { toast } from "react-toastify";
import ProgressLoader from "../components/ProgressLoader";
import { courseApi } from "../store/services/courseApi";
import { useDispatch } from "react-redux";

const AddLesson = () => {
  const dispatch = useDispatch();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [createLesson, { isLoading }] = useCreateLessonMutation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    content: "",
    order: 0,
  });

  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !videoFile) {
      toast.error("Title and Video are required");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (imageFile) data.append("image", imageFile);
    if (videoFile) data.append("video", videoFile);

    try {
      await createLesson({ courseId, formData: data }).unwrap();
      toast.success("Lesson created successfully");
      dispatch(
        courseApi.util.invalidateTags([{ type: "Course", id: courseId }])
      );
      navigate(`/courses/${courseId}`);
    } catch (error) {
      console.error("Lesson creation failed:", error);
      toast.error("Failed to create lesson");
    }
  };

  return isLoading ? (
    <ProgressLoader
      isVisible={isLoading}
      message="Your files are uploading, please wait..."
    />
  ) : (
    <div className="max-w-2xl w-full mx-auto mt-12 p-8 bg-white rounded-2xl shadow-lg border border-border-light">
      <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">
        ➕ Add New Lesson
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="form-label">Title *</label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter lesson title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-input"
            rows={3}
            placeholder="Short description of the lesson"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="form-label">Duration (e.g. 15 min)</label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="form-input"
            placeholder="Lesson duration"
          />
        </div>

        {/* Content */}
        <div>
          <label className="form-label">Text Content</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={4}
            className="form-input"
            placeholder="Write additional notes or lesson content"
          />
        </div>

        {/* Order */}
        <div>
          <label className="form-label">Lesson Order</label>
          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="form-label">Image (optional)</label>
          <label
            htmlFor="image-upload"
            className="btn border border-gray-300 rounded-lg px-4 py-2 mt-1 inline-block cursor-pointer bg-white hover:bg-gray-100 text-gray-700"
          >
            Upload Image
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className={!imageFile?`hidden`:"mx-4"}
          />
        </div>

        {/* Video Upload */}
        <div>
          <label className="form-label">Video *</label>
          <label
            htmlFor="video-upload"
            className="btn border border-gray-300 rounded-lg px-4 py-2 mt-1 inline-block cursor-pointer bg-white hover:bg-gray-100 text-gray-700"
          >
            Upload Video
          </label>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            required
            onChange={(e) => setVideoFile(e.target.files[0])}
            className={!videoFile?`hidden`:"mx-4"}
          />
        </div>
        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full cursor-pointer"
        >
          {isLoading ? "Saving..." : "Create Lesson"}
        </button>
      </form>
    </div>
  );
};

export default AddLesson;
