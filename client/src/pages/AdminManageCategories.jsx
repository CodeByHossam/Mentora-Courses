import React, { useEffect, useState } from "react";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../store/services/categoryApi";
import { handleApiError, handleApiSuccess } from "../utils/apiErrorHandler"; // ✅ Make sure this path is correct
import { useConfirm } from "../hooks/useConfirm";
const AdminManageCategories = () => {
  const { data: categories, isLoading, error } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  // Confirmation modal
  const { confirm, ConfirmationModalWrapper } = useConfirm();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  useEffect(() => {
    if (error) {
      handleApiError(error);
    }
  }, [error]);
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
      if (editingId) {
        await updateCategory({ id: editingId, ...formData }).unwrap();
        handleApiSuccess("Category updated successfully!");
      } else {
        await createCategory(formData).unwrap();
        handleApiSuccess("Category created successfully!");
      }
      resetForm();
    } catch (error) {
      handleApiError(error);
    }
  };
  const handleEdit = (category) => {
    setEditingId(category._id);
    setFormData({
      name: category.name,
      description: category.description,
    });
    setIsAdding(true);
  };
  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: "Delete Category",
      message:
        "Are you sure you want to delete this category? This action cannot be undone and will affect all courses using this category.",
    });
    if (confirmed) {
      try {
        await deleteCategory(id).unwrap();
        handleApiSuccess("Category deleted successfully!");
      } catch (error) {
        handleApiError(error);
      }
    }
  };
  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingId(null);
    setIsAdding(false);
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  return <AdminManageCategoriesView />;
};

export default AdminManageCategories;
