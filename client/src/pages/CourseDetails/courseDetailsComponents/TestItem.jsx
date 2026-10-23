import React, { useState } from "react";
import { Download, Edit, Trash2, X, GraduationCap, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEditTestMutation, useDeleteTestMutation } from "../../../store/services/courseInteractionApi";
import { toast } from "react-toastify";

const TestItem = ({
  test,
  studentSubmission,
  currentUser,
  courseId,
  handleTestSubmit,
  handleDeleteTestAnswer,
  isDeletingTestAnswer,
  toast,
  lessonName = "-",
  isEnrolled = false,
}) => {
  const [editTest] = useEditTestMutation();
  const [deleteTest] = useDeleteTestMutation();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: test?.title || "",
    description: test?.description || "",
    dueDate: test?.dueDate ? new Date(test.dueDate).toISOString().split('T')[0] : "",
    testFile: null,
  });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error("Test title is required");
      return;
    }

    setIsEditing(true);
    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description || "");
      formData.append("dueDate", editForm.dueDate || "");
      if (editForm.testFile) {
        formData.append("testFile", editForm.testFile);
      }

      await editTest({ courseId, testId: test._id, formData }).unwrap();
      toast.success("Test updated successfully!");
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to update test:", error);
      toast.error(error?.data?.message || "Failed to update test");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this test? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTest({ courseId, testId: test._id }).unwrap();
      toast.success("Test deleted successfully!");
    } catch (error) {
      console.error("Failed to delete test:", error);
      toast.error(error?.data?.message || "Failed to delete test");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value, files } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === "testFile" ? (files ? files[0] : null) : value,
    }));
  };

  const handleGradeTest = () => {
    // Navigate to grading page with course and test context
    navigate(`/grading/${courseId}/${test._id}`, {
      state: {
        courseName: test.courseName || "Course",
        testName: test.title,
        testType: test.testType,
        totalPoints: test.totalPoints
      }
    });
  };

  return (
    <>
      <tr>
        <td className="px-4 py-2 font-semibold">{test?.title || "Untitled Test"}</td>
        <td className="px-4 py-2">{lessonName}</td>
        <td className="px-4 py-2">{test?.dueDate ? new Date(test.dueDate).toLocaleDateString() : "-"}</td>
        <td className="px-4 py-2">{test?.description || "-"}</td>
        <td className="px-4 py-2">
          {/* Download test file */}
          {test?.fileUrl && (
            <a
              href={test.signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-2"
              download
            >
              <Download size={16} className="mr-1" />
            </a>
          )}
          {/* Student actions */}
          {currentUser?.role === "student" && isEnrolled && (
            <>
              {/* Answer Key Download for Students */}
              {test?.answerKey && test?.answerKeySignedUrl && (
                <a
                  href={test.answerKeySignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors mr-2"
                  download
                  title="Download Answer Key"
                >
                  <FileText size={16} className="mr-1" />
                  Answer Key
                </a>
              )}
              
              {studentSubmission?.answerFileUrl && (
                <>
                  <a
                    href={studentSubmission.answerFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-green-700 hover:text-green-900 transition-colors mr-2"
                    download
                  >
                    <Download size={16} className="mr-1" />
                  </a>
                  <button
                    className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200 bg-red-50 mr-2"
                    disabled={isDeletingTestAnswer}
                    onClick={() => handleDeleteTestAnswer(test._id, studentSubmission._id)}
                    title="Delete your answer"
                  >
                    Delete
                  </button>
                </>
              )}
              <label className="inline-block cursor-pointer text-[rgb(48,146,85)] hover:text-[rgb(33,98,58)] mr-2">
                Upload Answer
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleTestSubmit(test._id, e.target.files[0])}
                />
              </label>
            </>
          )}
          {/* Instructor/Admin actions */}
          {(currentUser?.role === "instructor" || currentUser?.role === "admin") && (
            <>
              <button
                onClick={handleGradeTest}
                className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded border border-green-200 bg-green-50 mr-2"
                title="Grade this test"
              >
                <GraduationCap size={12} />
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded border border-blue-200 bg-blue-50 mr-2"
                title="Edit test"
              >
                <Edit size={12} />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-200 bg-red-50"
                title="Delete test"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </td>
      </tr>

      {/* Edit Test Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">Edit Test</h2>

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
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={editForm.dueDate}
                  onChange={handleEditFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Test File (optional - leave empty to keep current file)</label>
                <input
                  type="file"
                  name="testFile"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.ppt,.pptx,.mp4,.mov,.avi,.mp3,.wav"
                  onChange={handleEditFormChange}
                  className="w-full"
                />
              </div>

              <button
                type="submit"
                disabled={isEditing}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                {isEditing ? "Updating..." : "Update Test"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TestItem;
