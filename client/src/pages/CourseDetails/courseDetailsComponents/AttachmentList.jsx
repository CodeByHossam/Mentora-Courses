import React, { useState } from "react";
import { Download, Edit, Trash2, X, Upload } from "lucide-react";
import {
  useEditAttachmentMutation,
  useRemoveAttachmentMutation,
} from "../../../store/services/courseInteractionApi";
import { toast } from "react-toastify";
import { getDownloadUrl, ensureFileExtension } from "../../../utils/fileUtils";

const AttachmentList = ({
  attachments = [],
  currentUser,
  courseId,
  lessons = [],
  handleUploadAttachment,
  uploadProgress,
  isLoading,
}) => {
  const [editAttachment] = useEditAttachmentMutation();
  const [removeAttachment] = useRemoveAttachmentMutation();

  const [editingAttachment, setEditingAttachment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    lessonId: "",
    file: null,
  });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error("Attachment title is required");
      return;
    }

    setIsEditing(true);
    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description || "");
      formData.append("lessonId", editForm.lessonId || "");
      if (editForm.file) {
        formData.append("file", editForm.file);
      }

      await editAttachment({
        courseId,
        attachmentId: editingAttachment._id,
        formData,
      }).unwrap();

      toast.success("Attachment updated successfully!");
      setEditingAttachment(null);
    } catch (error) {
      console.error("Failed to update attachment:", error);
      toast.error(error?.data?.message || "Failed to update attachment");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async (attachment) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this attachment? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await removeAttachment({
        courseId,
        attachmentId: attachment._id,
      }).unwrap();
      toast.success("Attachment deleted successfully!");
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      toast.error(error?.data?.message || "Failed to delete attachment");
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (attachment) => {
    setEditingAttachment(attachment);
    setEditForm({
      title: attachment.title || "",
      description: attachment.description || "",
      lessonId: attachment.lesson?._id || "",
      file: null,
    });
  };

  const cancelEdit = () => {
    setEditingAttachment(null);
    setEditForm({
      title: "",
      description: "",
      lessonId: "",
      file: null,
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, files } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "file" ? (files ? files[0] : null) : value,
    }));
  };

  const canEdit = (attachment) => {
    return (
      currentUser?.role === "admin" ||
      attachment.uploadedBy?._id === currentUser?.id
    );
  };

  const canDelete = (attachment) => {
    return (
      currentUser?.role === "admin" ||
      attachment.uploadedBy?._id === currentUser?.id
    );
  };

  const getFileIcon = (fileType) => {
    const type = fileType?.toLowerCase();
    if (type === "pdf") return "📄";
    if (["doc", "docx"].includes(type)) return "📝";
    if (["ppt", "pptx"].includes(type)) return "📊";
    if (type === "zip") return "📦";
    if (["jpg", "jpeg", "png", "gif"].includes(type)) return "🖼️";
    if (["mp4", "mov", "avi"].includes(type)) return "🎥";
    if (["mp3", "wav"].includes(type)) return "🎵";
    return "📎";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const canUpload = currentUser?.role === 'admin' || currentUser?.role === 'instructor';

  return (
    <div className="w-full overflow-x-auto">
      {/* Upload Section */}
      {canUpload && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Upload New Attachment</h4>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="file"
                onChange={(e) => handleUploadAttachment(e, null)}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.ppt,.pptx,.mp4,.mov,.avi,.mp3,.wav"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={isLoading}
              />
            </div>
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-600">{uploadProgress}%</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Supported formats: PDF, Word, PowerPoint, Images, Videos, Audio, ZIP (max 10MB)
          </p>
        </div>
      )}

      {attachments?.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[1000px] bg-white">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  File
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Lesson
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Size
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Uploaded By
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attachments.map((attachment) => (
                <tr
                  key={attachment._id}
                  className="hover:bg-blue-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 text-2xl">
                    {getFileIcon(attachment.fileType)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 truncate max-w-[200px]">
                      {attachment.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-[200px]">
                      {attachment.description || "No description"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    <span className="inline-block max-w-[150px] truncate">
                      {lessons
                        .filter((lesson) => lesson._id === attachment.lesson)
                        .map((lesson) => lesson.title)
                        .join(", ") || "General"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 text-sm">
                    {formatFileSize(attachment.fileSize)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium uppercase">
                      {attachment.fileType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 text-sm">
                    {attachment.uploadedBy?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-gray-700 text-sm">
                    {new Date(attachment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <a
                        href={attachment.signedUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                      {canEdit(attachment) && (
                        <button
                          onClick={() => startEdit(attachment)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {canDelete(attachment) && (
                        <button
                          onClick={() => handleDelete(attachment)}
                          disabled={isDeleting}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No attachments found for this course</p>
        </div>
      )}

      {/* Edit Attachment Modal */}
      {editingAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={cancelEdit}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">Edit Attachment</h2>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Lesson (optional)
                </label>
                <select
                  name="lessonId"
                  value={editForm.lessonId}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">-- No specific lesson --</option>
                  {lessons.map((lesson) => (
                    <option key={lesson._id} value={lesson._id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  File (optional - leave empty to keep current file)
                </label>
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.ppt,.pptx,.mp4,.mov,.avi,.mp3,.wav"
                  onChange={handleEditFormChange}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? "Updating..." : "Update Attachment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentList;
