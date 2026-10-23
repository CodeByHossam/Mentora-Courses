import React, { memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, Users, Star, BookOpen, Heart } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  selectIsAuthenticated,
  selectCurrentUser,
} from "../store/slices/authSlice";
import { useLikeCourseMutation } from "../store/services/courseApi";
import { handleApiError } from "../utils/errorHandler";

const CourseCard = memo(({ course }) => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const [likeCourse] = useLikeCourseMutation();

  const rating = course?.ratingInfo?.averageRating ?? course.rating ?? 0;
  const likesCount = course?.ratingInfo?.likesCount ?? course.likesCount ?? 0;
  const isLiked = course?.ratingInfo?.liked ?? course.liked ?? false;

  const renderStars = useCallback((avg) => {
    const stars = [];
    const rating = Math.round(avg || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill={i <= rating ? "currentColor" : "none"}
        />
      );
    }
    return stars;
  }, []);

  const handleEnroll = useCallback(() => {
    if (!isAuthenticated || !currentUser) {
      toast.info("Please login to enroll in this course");
      navigate("/login");
      return;
    }
    if (course.enrolledStudents?.includes(currentUser._id)) {
      toast.info("Already enrolled");
      navigate(`/courses/${course._id}/learn`);
      return;
    }
    navigate(`/payment/${course._id}`);
  }, [isAuthenticated, currentUser, course._id, course.enrolledStudents, navigate]);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      toast.info("Please login to like courses");
      return;
    }
    try {
      await likeCourse(course._id).unwrap();
    } catch (error) {
      handleApiError(error, { customMessage: "Failed to update like status" });
    }
  }, [isAuthenticated, likeCourse, course._id]);

  return (
    <div className="card card-hover h-[480px] flex flex-col overflow-hidden">
      {/* ==== Course Image ==== */}
      <div className="relative h-48 overflow-hidden bg-gray-200">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.title || 'Course'}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100"><BookOpen class="w-16 h-16 text-gray-400" /></div>';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <BookOpen className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        <div className="absolute top-3 right-3 flex gap-2">
          <span className="pill pill-primary shadow-sm">
            {course.category?.name || "Uncategorized"}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex justify-between text-white">
          <div className="flex items-center gap-1">
            {renderStars(rating)}
            <span className="text-sm font-medium ml-1">{Number(rating).toFixed(1)}</span>
          </div>
          <button
            onClick={handleLike}
            className="flex items-center gap-1 text-white hover:text-red-300 transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
            />
            <span className="text-sm">{likesCount}</span>
          </button>
        </div>
      </div>

      {/* ==== Content ==== */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {course.instructor?.name?.charAt(0) || "I"}
            </span>
          </div>
          <span className="text-sm text-muted truncate">
            {course.instructor?.name || "Instructor"}
          </span>
          <span className="pill pill-accent ml-auto">
            {course.level || "All Levels"}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-primary mb-2 line-clamp-2 hover:text-primary-dark transition-colors">
          <Link to={`/courses/${course._id}`}>{course.title}</Link>
        </h3>

        <p className="text-sm text-secondary mb-4 line-clamp-3 flex-grow">
          {course.description?.length > 150
            ? course.description.substring(0, 150) + "..."
            : course.description || "No description available"}
        </p>

        <div className="space-y-3 mt-auto">
          <div className="flex items-center justify-between text-sm text-muted">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration || "Self-paced"}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{course.lessonsCount || 0} lessons</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-primary">
                ${course.price || "99"}
              </span>
              {course.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  ${course.originalPrice}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted">
              <Users className="w-4 h-4" />
              <span className="text-sm">{course.enrolledCount || 0}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/courses/${course._id}`)}
              className="btn-secondary btn-sm w-full"
            >
              View Details
            </button>
            {isAuthenticated && (
              <button
                onClick={handleEnroll}
                className="btn-primary btn-sm w-full"
              >
                Enroll Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

CourseCard.displayName = "CourseCard";

export default CourseCard;
