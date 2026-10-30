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

  return <CreateCourseView />;
};

export default CreateCourse;
