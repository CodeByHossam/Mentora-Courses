import React, { useState, useEffect } from "react";
import { useAddTestMutation } from "../../../store/services/courseInteractionApi";
import { X } from "lucide-react";
import { toast } from "react-toastify";

const AddTestModal = ({
  showAddTestModal,
  setShowAddTestModal,
  lessons,
  courseId,
}) => {
  const [testForm, setTestForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    lessonId: "",
    testType: "progress",
    totalPoints: "",
    testFile: null,
  });

  const [testFormError, setTestFormError] = useState("");
  const [isAddingTest, setIsAddingTest] = useState(false);

  const [addTest] = useAddTestMutation();

  useEffect(() => {
    if (showAddTestModal) {
      setTestForm({
        title: "",
        description: "",
        dueDate: "",
        lessonId: "",
        testType: "progress",
        totalPoints: "",
        testFile: null,
      });
      setTestFormError("");
      setIsAddingTest(false);
    }
  }, [showAddTestModal]);

  const handleTestFormChange = (e) => {
    const { name, value, files } = e.target;

    setTestForm((prev) => ({
      ...prev,
      [name]: name === "testFile" ? (files ? files[0] : null) : value,
    }));
  };

  const handleAddTest = async (e) => {
    e.preventDefault();

    if (!testForm.title || !testForm.lessonId || !testForm.testType || !testForm.totalPoints || !testForm.testFile) {
      setTestFormError("Title, lesson, test type, total points, and file are required.");
      return;
    }

    if (isNaN(testForm.totalPoints) || testForm.totalPoints < 1 || testForm.totalPoints > 1000) {
      setTestFormError("Total points must be a number between 1 and 1000.");
      return;
    }

    setTestFormError("");
    setIsAddingTest(true);

    try {
      const formData = new FormData();
      formData.append("title", testForm.title);
      formData.append("description", testForm.description || "");
      formData.append("dueDate", testForm.dueDate || "");
      formData.append("lessonId", testForm.lessonId);
      formData.append("testType", testForm.testType);
      formData.append("totalPoints", testForm.totalPoints);
      formData.append("testFile", testForm.testFile);


      await addTest({ courseId, formData }).unwrap();

      toast.success("Test added successfully!");
      setShowAddTestModal(false);
    } catch (error) {
      console.error("Add Test Error:", error);
      setTestFormError(error?.data?.message || "Failed to add test.");
    } finally {
      setIsAddingTest(false);
    }
  };

  if (!showAddTestModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          onClick={() => setShowAddTestModal(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Add New Test</h2>

        {testFormError && (
          <div className="mb-2 text-red-600 text-sm">{testFormError}</div>
        )}

        <form onSubmit={handleAddTest} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Title *</label>
            <input
              type="text"
              name="title"
              value={testForm.title}
              onChange={handleTestFormChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Description</label>
            <textarea
              name="description"
              value={testForm.description}
              onChange={handleTestFormChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={testForm.dueDate}
              onChange={handleTestFormChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Select Lesson *</label>
            <select
              name="lessonId"
              value={testForm.lessonId}
              onChange={handleTestFormChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="" disabled>
                -- Select a lesson --
              </option>
              {lessons.map((lesson) => (
                <option key={lesson._id} value={lesson._id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Test Type *</label>
            <select
              name="testType"
              value={testForm.testType}
              onChange={handleTestFormChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="progress">📝 Progress Test</option>
              <option value="final">🎯 Final Test</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">
              Progress tests are used for regular assessments. Final tests are used for course completion evaluation.
            </p>
          </div>

          <div>
            <label className="block mb-1 font-medium">Total Points *</label>
            <input
              type="number"
              name="totalPoints"
              value={testForm.totalPoints}
              onChange={handleTestFormChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Enter maximum score (e.g., 100)"
              min="1"
              max="1000"
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              Maximum score/points that students can earn on this test.
            </p>
          </div>

          <div>
            <label className="block mb-1 font-medium">Test File *</label>
            <input
              type="file"
              name="testFile"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.ppt,.pptx,.mp4,.mov,.avi,.mp3,.wav"
              onChange={handleTestFormChange}
              className="w-full"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isAddingTest}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            {isAddingTest ? "Adding..." : "Add Test"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTestModal;
