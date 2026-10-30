import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";

// Icons
import { Star, StarOff } from "lucide-react";

// RTK Query hooks for course
import {
  useGetCourseQuery,
  useRateCourseMutation,
  useLikeCourseMutation,
  courseApi,
} from "../../store/services/courseApi";

// RTK Query hooks for lesson
import { useDeleteLessonMutation } from "../../store/services/lessonApi";

// RTK Query hooks for attachments and tests
import {
  useRemoveAttachmentMutation,
  useAddAttachmentMutation,
  useAddTestMutation,
  useSubmitTestAnswerMutation,
  useDeleteTestAnswerMutation,
  useGetCourseInteractionsQuery,
} from "../../store/services/courseInteractionApi";

// Auth selectors
import {
  selectIsAuthenticated,
  selectCurrentUser,
} from "../../store/slices/authSlice";

// UI components
import ProgressLoader from "../../components/ProgressLoader";
import { useCreateEnrollmentRequestMutation } from "../../store/services/enrollmentRequestApi";
import { useConfirm } from "../../hooks/useConfirm";
import { getDownloadUrl, ensureFileExtension } from "../../utils/fileUtils";

// Subcomponents
import CourseHeader from "./courseDetailsComponents/CourseHeader";
import LessonList from "./courseDetailsComponents/LessonList";
import TestList from "./courseDetailsComponents/TestList";
import CommentsSection from "./courseDetailsComponents/CommentsSection";
import AttachmentList from "./courseDetailsComponents/AttachmentList";
import AddTestModal from "./courseDetailsComponents/AddTestModal";
import CertificateSection from "../../components/CertificateSection";

// Live Session Components
import CourseLiveSessions from "../../components/LiveSession/CourseLiveSessions";
import ScheduleSessionForm from "../../components/LiveSession/ScheduleSessionForm";

// Allowed file types for validation
import allowedFileTypes from "../../config/allowedFileTypes";

const CourseDetails = () => {
  let notEnrolledContent;
  const dispatch = useDispatch();
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Upload progress bar
  const [uploadProgress, setUploadProgress] = React.useState(0);

  // Confirmation modal logic
  const { confirm, ConfirmationModalWrapper } = useConfirm();

  // Redux-auth state
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  // Course & user rating info (course already contains ratingInfo; avoid extra fetch)
  const { data: course, isLoading, error } = useGetCourseQuery(courseId);
  const userRatingInfo = isAuthenticated ? {
    userRating: course?.ratingInfo?.userRating,
    liked: course?.ratingInfo?.liked,
  } : {};

  const {
    data: interactions,
    isLoading: isLoadingInteractions,
    error: interactionsError,
  } = useGetCourseInteractionsQuery(courseId);

  const lessons = course?.lessons || [];
  const ratingInfo = course?.ratingInfo || {};
  const userRating = userRatingInfo?.userRating;
  const liked = userRatingInfo?.liked;

  // Local state
  const [userRatingInput, setUserRatingInput] = React.useState(userRating || 0);
  React.useEffect(() => {
    setUserRatingInput(userRating || 0);
  }, [userRating]);

  // Mutations
  const [rateCourse] = useRateCourseMutation();
  const [likeCourse] = useLikeCourseMutation();
  const [deleteLesson] = useDeleteLessonMutation();
  const [removeAttachment] = useRemoveAttachmentMutation();
  const [addAttachment] = useAddAttachmentMutation();
  const [addTest] = useAddTestMutation();
  const [submitTestAnswer] = useSubmitTestAnswerMutation();
  const [deleteTestAnswer, { isLoading: isDeletingTestAnswer }] =
    useDeleteTestAnswerMutation();
  const [enrollInCourse] = useCreateEnrollmentRequestMutation();

  // Modal visibility
  const [showAddTestModal, setShowAddTestModal] = React.useState(false);
  const [showScheduleSessionForm, setShowScheduleSessionForm] = React.useState(false);

  // Helper to render course rating as stars
  const renderStars = (avg) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= Math.round(avg) ? (
          <Star
            key={i}
            className="w-6 h-6 text-yellow-400"
            fill="currentColor"
          />
        ) : (
          <StarOff key={i} className="w-6 h-6 text-gray-300" />
        )
      );
    }
    return stars;
  };

  // Like handler
  const handleLike = async () => {
    try {
      await likeCourse(courseId).unwrap();
      dispatch(
        courseApi.util.invalidateTags([{ type: "Course", id: courseId }])
      );
    } catch {
      toast.error("Failed to like/unlike course");
    }
  };

  const isEnrolled =
    course?.enrolledStudents?.some((s) => s._id === currentUser?.id) || false;
  const hasPendingRequest = course?.hasPendingRequest || false;

  const getAttachmentsForLesson = (lessonId) => {
    if (!interactions?.attachments) return [];
    return interactions.attachments.filter(
      (a) => a.lesson?.toString() === lessonId?.toString()
    );
  };

  const handleEnroll = async () => {
    if (!isAuthenticated || !currentUser) {
      toast.info("Please login to enroll in this course");
      navigate("/login", { state: { from: `/courses/${courseId}` } });
      return;
    }

    if (isEnrolled) {
      toast.info("You are already enrolled in this course");
      navigate(`/courses/${courseId}/learn`);
      return;
    }

    if (hasPendingRequest) {
      toast.info("You already have a pending request for this course");
      return;
    }

    // Redirect to payment page for course enrollment
    navigate(`/payment/${courseId}`);
  };

  const handleDelete = async (lessonId) => {
    const confirmed = await confirm({
      title: "Delete Lesson",
      message:
        "Are you sure you want to delete this lesson? This action cannot be undone.",
    });
    if (!confirmed) return;

    try {
      await deleteLesson(lessonId).unwrap();
      toast.success("Lesson deleted successfully");
      dispatch(
        courseApi.util.invalidateTags([{ type: "Course", id: courseId }])
      );
    } catch {
      toast.error("Failed to delete lesson");
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    const confirmed = await confirm({
      title: "Delete Attachment",
      message:
        "Are you sure you want to delete this attachment? This action cannot be undone.",
    });
    if (!confirmed) return;

    try {
      await removeAttachment({ courseId, attachmentId }).unwrap();
      toast.success("Attachment deleted successfully");
    } catch {
      toast.error("Failed to delete attachment");
    }
  };

  const handleUploadAttachment = async (e, lessonId) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      e.target.value = null;
      return;
    }

    if (!allowedFileTypes.includes(file.type)) {
      toast.error(
        "Invalid file type. Allowed: PDF, Word, PowerPoint, ZIP, images, videos, audio."
      );
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
        lessonId,
      }).unwrap();

      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
      toast.success("Attachment uploaded successfully");
      e.target.value = null;
    } catch {
      setUploadProgress(0);
      toast.error("Failed to upload attachment");
      e.target.value = null;
    }
  };

  const [testAnswerError, setTestAnswerError] = React.useState("");

  const handleTestSubmit = async (testId, file) => {
    if (!file) {
      setTestAnswerError("Please select a file to upload");
      return;
    }
    try {
      await submitTestAnswer({ courseId, testId, answerFile: file }).unwrap();
      setTestAnswerError("");
    } catch {
      setTestAnswerError("Failed to submit test answer. Please try again.");
    }
  };
  const handleDeleteTestAnswer = async (testId, submissionId) => {
    try {
      await deleteTestAnswer({ courseId, testId, submissionId }).unwrap();
      setTestAnswerError("");
    } catch {
      setTestAnswerError("Failed to delete your answer. Please try again.");
    }
  };

  if (isLoading || isLoadingInteractions) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ProgressLoader isVisible message="Loading course details..." />
      </div>
    );
  }

  if (error || !course || interactionsError) {
    //check if the back end sent a message of "You are not enrolled in this course"
    const notEnrolledMessage =
      error?.data?.message?.toLowerCase().includes("enroll") ||
      interactionsError?.data?.message?.toLowerCase().includes("enroll");
    const noTokenMessage =
      error?.data?.message?.toLowerCase().includes("token") ||
      interactionsError?.data?.message?.toLowerCase().includes("token");
    const isDraftCourse = error?.data?.courseStatus === "draft" || error?.data?.message?.toLowerCase().includes("draft");
    const isArchivedCourse = error?.data?.courseStatus === "archived" || error?.data?.message?.toLowerCase().includes("archived");

    notEnrolledContent = (
      <div
        className={`${
          notEnrolledContent
            ? "min-h-[60vh]"
            : "bg-white rounded-xl shadow-lg overflow-hidden mb-10 border border-gray-200 p-8"
        } flex flex-col items-center justify-center text-center px-4`}
      >
        {isDraftCourse ? (
          <>
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Course in Draft Mode
            </h2>
            <p className="text-gray-600 mb-6">
              {error?.data?.message || "This course is still being prepared and is not yet available."}
            </p>
            {currentUser?.role === "instructor" && (
              <button
                onClick={() => navigate("/instructor/courses")}
                className="px-6 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition duration-400 ease-in-out"
              >
                Go to My Courses
              </button>
            )}
          </>
        ) : isArchivedCourse ? (
          <>
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Course Archived
            </h2>
            <p className="text-gray-600 mb-6">
              {error?.data?.message || "This course has been archived and is only available to enrolled students."}
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="px-6 py-2 cursor-pointer bg-gray-600 text-white rounded-lg hover:bg-gray-700 hover:shadow-lg transition duration-400 ease-in-out"
            >
              Browse Other Courses
            </button>
          </>
        ) : notEnrolledMessage ? (
          <>
            <div className="text-6xl mb-4">🎓</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Join this course to get started!
            </h2>
            <p className="text-gray-600 mb-6">
              It looks like you are not enrolled yet. Enroll now to access
              lessons, tests, and more.
            </p>
            <button
              onClick={handleEnroll}
              className="px-6 py-2 cursor-pointer bg-accent-dark text-white rounded-lg hover:bg-green-700 hover:shadow-lg transition duration-400 ease-in-out"
            >
              Enroll Now
            </button>
          </>
        ) : noTokenMessage ? (
          <>
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Login Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please login to see all course details
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition duration-400 ease-in-out"
            >
              Login
            </button>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              {error?.data?.message ||
                interactionsError?.data?.message ||
                "Failed to load course"}
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="px-6 py-2 cursor-pointer bg-gray-600 text-white rounded-lg hover:bg-gray-700 hover:shadow-lg transition duration-400 ease-in-out"
            >
              Browse Courses
            </button>
          </>
        )}
      </div>
    );
  }

  return <CourseDetailsView />;
};

export default CourseDetails;
