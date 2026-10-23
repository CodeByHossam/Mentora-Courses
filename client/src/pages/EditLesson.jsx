import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetLessonQuery,
  useUpdateLessonMutation,
} from "../store/services/lessonApi";
import { toast } from "react-toastify";
import ProgressLoader from "../components/ProgressLoader";

const EditLesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const {
    data: lesson,
    isLoading,
    isError,
    error,
  } = useGetLessonQuery(lessonId);
  const [updateLesson, { isLoading: isUpdating }] = useUpdateLessonMutation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    content: "",
    order: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || "",
        description: lesson.description || "",
        duration: lesson.duration || "",
        content: lesson.content || "",
        order: lesson.order || 0,
      });
    }
  }, [lesson]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Title is required");
      return;
    }
    let body;
    if (imageFile || videoFile) {
      // Use FormData if files are present
      body = new FormData();
      body.append("title", formData.title);
      body.append("description", formData.description);
      body.append("duration", formData.duration);
      body.append("content", formData.content);
      body.append("order", formData.order);
      if (imageFile) body.append("image", imageFile);
      if (videoFile) body.append("video", videoFile);
    } else {
      // Use JSON for text-only updates
      body = {
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        content: formData.content,
        order: formData.order,
      };
    }
    try {
      await updateLesson({ id: lessonId, body }).unwrap();
      toast.success("Lesson updated successfully");
      navigate(-1);
    } catch (err) {
      toast.error("Failed to update lesson");
    }
  };

  if (isLoading) {
    return <ProgressLoader isVisible={true} message="Loading lesson..." />;
  }
  if (isError || !lesson) {
    return (
      <div className="text-center text-red-600 mt-10">
        Failed to load lesson.
      </div>
    );
  }

  return (
    <div className="w-full max-w-maxAppWidth mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Edit Lesson
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block mb-1 font-medium">Title *</label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        {/* Description */}
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        {/* Duration */}
        <div>
          <label className="block mb-1 font-medium">
            Duration (e.g. 15 min)
          </label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        {/* Content */}
        <div>
          <label className="block mb-1 font-medium">Text Content</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        {/* Order */}
        <div>
          <label className="block mb-1 font-medium">Lesson Order</label>
          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        {/* Image Upload (optional) */}
        <div>
          <label className="block mb-1 font-medium">Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />
        </div>
        {/* Video Upload (optional) */}
        <div>
          <label className="block mb-1 font-medium">Video (optional)</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
          />
        </div>
        {/* Submit */}
        <button
          type="submit"
          disabled={isUpdating}
          className="bg-[rgb(33,98,58)] text-white px-6 py-2 rounded hover:bg-[rgb(48,146,85)] transition"
        >
          {isUpdating ? "Saving..." : "Update Lesson"}
        </button>
      </form>
    </div>
  );
};

export default EditLesson;
