import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";

// Redux
import { selectCurrentUser } from "../../store/slices/authSlice";
import {
  selectSelectedLesson,
  setSelectedLesson,
} from "../../store/slices/selectedLessonSlice";

// API Hooks
import { useGetCourseQuery } from "../../store/services/courseApi";
import {
  useGetCourseInteractionsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAddTestMutation,
  useSubmitTestAnswerMutation,
  useDeleteTestAnswerMutation,
  useAddAttachmentMutation,
  useRemoveAttachmentMutation,
} from "../../store/services/courseInteractionApi";

// Components
import ProgressLoader from "../../components/ProgressLoader";
import { useConfirm } from "../../hooks/useConfirm";
import LessonHeader from "./components/LessonHeader";
import LessonSidebar from "./components/LessonSidebar";
import LessonContent from "./components/LessonContent";
import TestSection from "./components/TestSection";
import AttachmentSection from "./components/AttachmentSection";
import CommentsSection from "./components/CommentsSection";
import AddTestModal from "./components/AddTestModal";

const CourseLesson = () => {
  const dispatch = useDispatch();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const selectedLesson = useSelector(selectSelectedLesson);
  
  // Local state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [testForm, setTestForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    testType: "progress",
    totalPoints: "",
    testFile: null,
  });
  const [testFormError, setTestFormError] = useState("");
  const [isAddingTest, setIsAddingTest] = useState(false);

  // Confirmation modal
  const { confirm, ConfirmationModalWrapper } = useConfirm();

  const {
    data: course,
    isLoading: isLoadingCourse,
    error: courseError,
    isError: isCourseError,
  } = useGetCourseQuery(courseId);
  const currentLesson = selectedLesson || course?.lessons?.[0];

  const {
    data: interactions,
    isLoading: isLoadingInteractions,
    error: interactionsError,
    isError: isInteractionsError,
    refetch: refetchInteractions,
  } = useGetCourseInteractionsQuery(courseId);

  const [addComment, { isLoading: isAddingComment }] = useAddCommentMutation();
  const [deleteComment, { isLoading: isDeletingComment }] = useDeleteCommentMutation();
  const [addTest] = useAddTestMutation();
  const [submitTestAnswer] = useSubmitTestAnswerMutation();
  const [deleteTestAnswer, { isLoading: isDeletingTestAnswer }] =
    useDeleteTestAnswerMutation();
  const [addAttachment, { isLoading: isUploadingAttachment }] =
    useAddAttachmentMutation();
  const [removeAttachment] = useRemoveAttachmentMutation();

  useEffect(() => {
    if (isCourseError) {
      setError("Course not found");
      navigate("/courses");
    }
  }, [isCourseError, navigate]);

  useEffect(() => {
    if (isInteractionsError) {
      setError("Failed to fetch course interactions");
    }
  }, [isInteractionsError]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await addComment({
        courseId,
        content: commentText,
      }).unwrap();
      setCommentText("");
      toast.success("Comment added successfully!");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleCommentDelete = async (commentId) => {
    const confirmed = await confirm({
      title: "Delete Comment",
      message: "Are you sure you want to delete this comment? This action cannot be undone.",
    });
    if (!confirmed) return;

    try {
      await deleteComment({ courseId, commentId }).unwrap();
      toast.success("Comment deleted successfully");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleTestSubmit = async (testId, file) => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    try {
      await submitTestAnswer({ courseId, testId, answerFile: file }).unwrap();
      toast.success("Test answer submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit test answer. Please try again.");
    }
  };

  const handleDeleteTestAnswer = async (testId, submissionId) => {
    const confirmed = await confirm({
      title: "Delete Test Answer",
      message: "Are you sure you want to delete your test answer? This action cannot be undone.",
    });
    if (!confirmed) return;

    try {
      await deleteTestAnswer({ courseId, testId, submissionId }).unwrap();
      toast.success("Test answer deleted successfully");
    } catch (error) {
      toast.error("Failed to delete test answer. Please try again.");
    }
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      e.target.value = null;
      return;
    }

    try {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await addAttachment({
        courseId,
        file,
        title: file.name,
        description: "Course material",
        lessonId: currentLesson?._id,
      }).unwrap();

      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
      toast.success("Attachment uploaded successfully");
      e.target.value = null;
    } catch (error) {
      setUploadProgress(0);
      toast.error("Failed to upload attachment");
      e.target.value = null;
    }
  };

  const handleSelectLesson = (lesson) => {
    dispatch(setSelectedLesson(lesson));
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Add test form handlers
  const handleTestFormChange = (e) => {
    const { name, value, files } = e.target;
    setTestForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    if (!testForm.title || !testForm.testType || !testForm.totalPoints || !testForm.testFile) {
      setTestFormError("Please fill in all required fields including test type and total points");
      return;
    }

    if (isNaN(testForm.totalPoints) || testForm.totalPoints < 1 || testForm.totalPoints > 1000) {
      setTestFormError("Total points must be a number between 1 and 1000.");
      return;
    }

    setIsAddingTest(true);
    setTestFormError("");

    try {
      await addTest({
        courseId,
        title: testForm.title,
        description: testForm.description,
        dueDate: testForm.dueDate,
        testType: testForm.testType,
        totalPoints: testForm.totalPoints,
        testFile: testForm.testFile,
      }).unwrap();

      toast.success("Test added successfully!");
      setShowAddTestModal(false);
      setTestForm({
        title: "",
        description: "",
        dueDate: "",
        testType: "progress",
        totalPoints: "",
        testFile: null,
      });
    } catch (error) {
      setTestFormError(
        error?.data?.message ||
        "Failed to add test. Please try again."
      );
    } finally {
      setIsAddingTest(false);
    }
  };

  if (isLoadingCourse || isLoadingInteractions) {
    return (
      <ProgressLoader isVisible={true} message="Loading course content..." />
    );
  }

  if (!course || isCourseError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center w-full ">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Course not found
          </h2>
          <button
            onClick={() => navigate("/courses")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (isInteractionsError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center w-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
             {interactionsError?.data?.message || "Failed to fetch course interactions. Please try again."}
          </h2>
          <button
            onClick={() => navigate("/courses")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Confirmation Modal */}
      <ConfirmationModalWrapper />
      
      {/* Add Test Modal */}
      <AddTestModal
        showAddTestModal={showAddTestModal}
        setShowAddTestModal={setShowAddTestModal}
        testForm={testForm}
        testFormError={testFormError}
        isAddingTest={isAddingTest}
        handleTestFormChange={handleTestFormChange}
        handleAddTest={handleAddTest}
      />

      {/* Progress Loader for Upload */}
      <ProgressLoader
        isVisible={isUploadingAttachment}
        message={`Uploading material... ${uploadProgress}%`}
      />

      {/* Header */}
      <LessonHeader
        courseId={courseId}
        course={course}
        currentLesson={currentLesson}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            <LessonContent currentLesson={currentLesson} />
            
            <AttachmentSection
              user={user}
              interactions={interactions}
              currentLesson={currentLesson}
              courseId={courseId}
              isUploadingAttachment={isUploadingAttachment}
              uploadProgress={uploadProgress}
              error={error}
              handleAttachmentUpload={handleAttachmentUpload}
              removeAttachment={removeAttachment}
            />

            <CommentsSection
              user={user}
              interactions={interactions}
              commentText={commentText}
              setCommentText={setCommentText}
              isAddingComment={isAddingComment}
              isDeletingComment={isDeletingComment}
              handleCommentSubmit={handleCommentSubmit}
              handleCommentDelete={handleCommentDelete}
            />

            <TestSection
              user={user}
              interactions={interactions}
              setShowAddTestModal={setShowAddTestModal}
              handleTestSubmit={handleTestSubmit}
              handleDeleteTestAnswer={handleDeleteTestAnswer}
              isDeletingTestAnswer={isDeletingTestAnswer}
            />
          </div>

          {/* Sidebar with Lessons */}
          <LessonSidebar
            course={course}
            currentLesson={currentLesson}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            handleSelectLesson={handleSelectLesson}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseLesson;
