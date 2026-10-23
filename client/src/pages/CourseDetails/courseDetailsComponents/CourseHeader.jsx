import React from "react";
import { Edit, Heart, Star, StarOff, BookOpen } from "lucide-react";


const CourseHeader = ({
  notEnrolledContent,
  course,
  currentUser,
  courseId,
  navigate,
  handleEnroll,
  isEnrolled,
  hasPendingRequest,
  renderStars,
  ratingInfo,
  handleLike,
  userRatingInput,
  setUserRatingInput,
  rateCourse,
  dispatch,
  courseApi,
  toast,
  isAuthenticated,
}) => {
  // Return loading state if course is not available
  if (!course) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-10 border border-gray-200">
        <h1 className="text-3xl text-center font-extrabold tracking-tight py-6 px-2 bg-white text-accent-dark border-b border-gray-100 shadow-sm">
          Loading...
        </h1>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 sm:mb-8 lg:mb-10 border border-gray-200">
      {/* Course Title */}
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          {course.title}
        </h1>
        <p className="text-gray-600 text-lg">{course.description}</p>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left: Course Image */}
        <div className="sm:w-full md:w-2/5 lg:w-1/3   flex-shrink-0 relative bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center"
             style={{ minHeight: 250, maxHeight: 350 }}>
          {course?.imageUrl ? (
            <img
              src={course.imageUrl}
              alt={course?.title}
              className="w-full h-full object-cover object-center "
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`${course?.imageUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
            <BookOpen className="w-16 h-16 text-white" />
          </div>
        </div>
        
        {/* Right: Course Details */}
        <div className="lg:w-2/3 w-full p-6 flex flex-col justify-between">
          {/* Price and Course Info */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-[rgb(33,98,58)]">
                ${course?.price}
              </span>
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {course?.level}
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {course?.students} students
                </div>
              </div>
            </div>

            {/* Rating & Like Section */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                {renderStars(ratingInfo?.averageRating ?? 0)}
                <span className="text-lg font-semibold text-gray-700">
                  {Number(ratingInfo?.averageRating ?? 0).toFixed(1)} / 5
                </span>
                <span className="text-sm text-gray-500">
                  ({ratingInfo?.ratingsCount ?? 0} ratings)
                </span>
              </div>
              <button
                className={`flex items-center gap-1 text-[rgb(48,146,85)] hover:text-[rgb(33,98,58)] transition`}
                onClick={handleLike}
                title={ratingInfo?.liked ? "Unlike" : "Like"}
                disabled={!isAuthenticated}
                style={{ outline: "none", border: "none", background: "none" }}
              >
                {ratingInfo?.liked ? (
                  <Heart
                    className="w-6 h-6 fill-[rgb(48,146,85)] text-[rgb(48,146,85)]"
                    fill="currentColor"
                  />
                ) : (
                  <Heart
                    className="w-6 h-6 text-[rgb(48,146,85)]"
                    fill="none"
                  />
                )}
                <span className="text-base font-semibold">
                  {ratingInfo?.likesCount ?? 0}
                </span>
              </button>
            </div>

            {/* Instructor Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructor</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[rgb(33,98,58)] flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">
                      {course.instructor?.name?.charAt(0) || "I"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {course.instructor?.name}
                    </h4>
                    <p className="text-gray-600 text-sm">{course.instructor?.email}</p>
                  </div>
                </div>
                {/* Chat with Instructor Button */}
                {isAuthenticated && currentUser?.role === "student" && (
                  <button
                    onClick={() => navigate(`/messages?instructor=${course.instructor?._id}`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    💬 Chat
                  </button>
                )}
              </div>
            </div>

            {/* Course Duration */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Duration</h3>
              <p className="text-lg font-semibold text-gray-900">{course?.duration}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {/* Go to Lessons Button - Only for enrolled students, admins, or course instructor */}
              {(isEnrolled || 
                currentUser?.role === "admin" || 
                (currentUser?.role === "instructor" && course?.instructor?._id === currentUser?.id)) && (
                <button
                  onClick={() => navigate(`/courses/${courseId}/learn`)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 font-semibold shadow-md hover:shadow-lg"
                >
                  <BookOpen size={18} />
                  <span>Go to Lessons</span>
                </button>
              )}
              
              {/* Edit Course Button - Only for instructors and admins */}
              {(currentUser?.role === "instructor" ||
                currentUser?.role === "admin") && (
                <button
                  disabled={notEnrolledContent}
                  onClick={() =>
                    navigate(`/instructor/courses/edit/${courseId}`)
                  }
                  className={`${
                    notEnrolledContent
                      ? "bg-gray-300"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  } text-white px-5 py-2 rounded-lg transition flex items-center space-x-2 cursor-pointer`}
                >
                  <Edit size={18} />
                  <span>Edit Course</span>
                </button>
              )}
              
              {/* Enroll Button - Only for students */}
              {currentUser?.role === "student" && (
                <button
                  onClick={handleEnroll}
                  disabled={isEnrolled || hasPendingRequest}
                  className={
                    isEnrolled
                      ? "bg-gray-300 text-gray-700 px-5 py-2 rounded-lg cursor-not-allowed"
                      : hasPendingRequest
                      ? "bg-yellow-500 text-white px-5 py-2 rounded-lg cursor-not-allowed"
                      : "bg-[rgb(33,98,58)] text-white px-5 py-2 rounded-lg hover:bg-[rgb(48,146,85)] transition"
                  }
                >
                  {isEnrolled
                    ? "Enrolled"
                    : hasPendingRequest
                    ? "Pending"
                    : "Enroll Now"}
                </button>
              )}
            </div>
          </div>

          {/* User rating input (if enrolled and userRating is defined) */}
          {isAuthenticated &&
            isEnrolled &&
            typeof ratingInfo?.userRating !== "undefined" && (
              <div className="mt-8 flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <label className="text-base font-medium text-gray-700">
                  Your Rating:
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={async () => {
                        setUserRatingInput(num);
                        try {
                          await rateCourse({
                            id: courseId,
                            value: num,
                          }).unwrap();
                          toast.success("Your rating has been submitted!");
                          // Invalidate course query to refetch updated ratingInfo
                          dispatch(
                            courseApi.util.invalidateTags([
                              { type: "Course", id: courseId },
                            ])
                          );
                        } catch (err) {
                          toast.error(
                            err?.data?.message || "Failed to submit rating"
                          );
                        }
                      }}
                      className="focus:outline-none cursor-pointer"
                      aria-label={`Rate ${num} star${num > 1 ? "s" : ""}`}
                    >
                      {userRatingInput >= num ? (
                        <Star
                          className="w-7 h-7 text-yellow-400 cursor-pointer"
                          fill="currentColor"
                        />
                      ) : (
                        <StarOff className="w-7 h-7 text-gray-300 cursor-pointer" />
                      )}
                    </button>
                  ))}
                </div>
                {typeof ratingInfo?.userRating !== "undefined" && (
                  <span className="ml-2 text-green-600 font-medium">
                    (You rated: {ratingInfo.userRating})
                  </span>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CourseHeader;
