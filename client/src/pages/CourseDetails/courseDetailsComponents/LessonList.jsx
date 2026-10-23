import React from "react";
import {
  Plus,
  Upload,
  Download,
  X,
  Edit,
  Trash2,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
} from "lucide-react";
import LessonItem from "./LessonItem";

const LessonList = ({
  lessons,
  currentUser,
  courseId,
  navigate,
  getAttachmentsForLesson,
  handleUploadAttachment,
  handleDelete,
  handleDeleteAttachment,
  isLoading,
  uploadProgress,
  getDownloadUrl,
  ensureFileExtension,
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        {(currentUser?.role === "instructor" ||
          currentUser?.role === "admin") && (
          <button
            onClick={() => navigate(`/courses/${courseId}/add-lesson`)}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus size={18} />
            <span className="font-semibold">Add New Lesson</span>
          </button>
        )}
      </div>

      {/* Lessons Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading lessons...</span>
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No lessons found for this course.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[800px] bg-white">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Lesson Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Duration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Materials</th>
                {(currentUser?.role === "instructor" ||
                  currentUser?.role === "admin") && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lessons.map((lesson, index) => {
                const lessonAttachments = getAttachmentsForLesson(lesson._id);
                return (
                  <LessonItem
                    key={lesson._id}
                    lesson={lesson}
                    lessonAttachments={lessonAttachments}
                    currentUser={currentUser}
                    courseId={courseId}
                    navigate={navigate}
                    handleUploadAttachment={handleUploadAttachment}
                    handleDelete={handleDelete}
                    handleDeleteAttachment={handleDeleteAttachment}
                    isLoading={isLoading}
                    uploadProgress={uploadProgress}
                    getDownloadUrl={getDownloadUrl}
                    ensureFileExtension={ensureFileExtension}
                    index={index}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LessonList;
