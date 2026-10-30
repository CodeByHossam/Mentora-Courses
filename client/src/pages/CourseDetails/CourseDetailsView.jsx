import React from "react";

const CourseDetailsView = (props) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConfirmationModalWrapper />

        <ProgressLoader
          isVisible={uploadProgress > 0}
          message={`Uploading attachment... ${uploadProgress}%`}
        />

        <CourseHeader
          notEnrolledContent={notEnrolledContent}
          course={course}
          currentUser={currentUser}
          courseId={courseId}
          navigate={navigate}
          handleEnroll={handleEnroll}
          isEnrolled={isEnrolled}
          hasPendingRequest={hasPendingRequest}
          renderStars={renderStars}
          ratingInfo={{ ...ratingInfo, userRating, liked }}
          handleLike={handleLike}
          userRatingInput={userRatingInput}
          setUserRatingInput={setUserRatingInput}
          rateCourse={rateCourse}
          dispatch={dispatch}
          courseApi={courseApi}
          toast={toast}
          isAuthenticated={isAuthenticated}
        />
        {/* enrolled conditions */}
        {notEnrolledContent ? (
          notEnrolledContent
        ) : (
          <>
            {/* Lessons section */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  📚 Course Lessons
                </h2>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {lessons.length} lessons
                </div>
              </div>
              <LessonList
                lessons={lessons}
                currentUser={currentUser}
                courseId={courseId}
                navigate={navigate}
                getAttachmentsForLesson={getAttachmentsForLesson}
                handleUploadAttachment={handleUploadAttachment}
                handleDelete={handleDelete}
                handleDeleteAttachment={handleDeleteAttachment}
                isLoading={isLoading}
                uploadProgress={uploadProgress}
                getDownloadUrl={getDownloadUrl}
                ensureFileExtension={ensureFileExtension}
              />
            </div>

            {/* Live Sessions section */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  🎥 Live Sessions
                </h2>
                {currentUser?.role === 'instructor' && course?.instructor?._id === currentUser?.id && (
                  <button
                    onClick={() => setShowScheduleSessionForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center text-sm"
                  >
                    <span className="mr-2">➕</span>
                    Schedule Session
                  </button>
                )}
              </div>
              <CourseLiveSessions
                courseId={courseId}
                isEnrolled={isEnrolled}
              />
            </div>

            {/* Tests section */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  📝 Course Tests
                </h2>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {interactions?.tests?.length || 0} tests
                </div>
              </div>
              <TestList
                tests={interactions?.tests || []}
                course={course}
                currentUser={currentUser}
                courseId={courseId}
                setShowAddTestModal={setShowAddTestModal}
                handleTestSubmit={handleTestSubmit}
                handleDeleteTestAnswer={handleDeleteTestAnswer}
                isDeletingTestAnswer={isDeletingTestAnswer}
                toast={toast}
                lessons={lessons}
                isEnrolled={isEnrolled}
              />
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  💬 Discussion
                </h2>
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  {interactions?.comments?.length || 0} comments
                </div>
              </div>
              <CommentsSection
                comments={interactions?.comments || []}
                currentUser={currentUser}
                courseId={courseId}
              />
            </div>

            {/* Attachments section */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  📎 Course Materials
                </h2>
                <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  {interactions?.attachments?.length || 0} files
                </div>
              </div>
              <AttachmentList
                attachments={interactions?.attachments || []}
                currentUser={currentUser}
                courseId={courseId}
                lessons={lessons}
              />
            </div>

            {/* Certificates section - Only for instructors and admins */}
            {(currentUser?.role === 'instructor' || currentUser?.role === 'admin') && (
              <CertificateSection courseId={courseId} />
            )}
            {/* Add test form */}
            <AddTestModal
              showAddTestModal={showAddTestModal}
              setShowAddTestModal={setShowAddTestModal}
              lessons={lessons}
              courseId={courseId}
            />

            {/* Schedule Session Form Modal */}
            {showScheduleSessionForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <ScheduleSessionForm
                    courseId={courseId}
                    onSuccess={() => {
                      setShowScheduleSessionForm(false);
                      toast.success('Live session scheduled successfully! 🎉');
                    }}
                    onCancel={() => setShowScheduleSessionForm(false)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CourseDetailsView;
