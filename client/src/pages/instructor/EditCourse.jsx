import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetCourseQuery,
  useUpdateCourseMutation,
} from "../../store/services/courseApi";
import { useGetCategoriesQuery } from "../../store/services/categoryApi";
import { handleApiError, handleApiSuccess } from "../../utils/apiErrorHandler";

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

  return null;
};

export default EditCourse;
