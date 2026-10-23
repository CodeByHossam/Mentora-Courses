import React from 'react';
import { Download } from 'lucide-react';
import { getDownloadUrl, ensureFileExtension } from '../../../utils/fileUtils';

const AttachmentSection = ({ 
  user, 
  interactions, 
  currentLesson, 
  courseId, 
  isUploadingAttachment, 
  uploadProgress, 
  error, 
  handleAttachmentUpload, 
  removeAttachment 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="text-3xl mr-3">📚</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Course Materials
          </h2>
        </div>
        {user?.role === "instructor" && (
          <label
            className={`cursor-pointer px-6 py-3 rounded-xl font-medium transition-all duration-200 transform ${
              isUploadingAttachment
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:scale-105 shadow-lg"
            }`}
          >
            {isUploadingAttachment ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-2">📎</span>
                Upload Material
              </div>
            )}
            <input
              type="file"
              className="hidden"
              onChange={handleAttachmentUpload}
              disabled={isUploadingAttachment}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.ppt,.pptx,.mp4,.mov,.avi,.mp3,.wav"
            />
          </label>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center">
          <div className="text-xl mr-3">⚠️</div>
          <div>
            <p className="font-medium">Upload Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploadingAttachment && uploadProgress > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center mb-2">
            <div className="text-xl mr-3">📤</div>
            <p className="font-medium text-blue-800">Uploading Material</p>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-600 mt-2 font-medium">
            {uploadProgress}% complete
          </p>
        </div>
      )}

      <div className="space-y-4">
        {interactions?.attachments?.filter(
          (attachment) =>
            !attachment.lessonId ||
            attachment.lessonId === currentLesson?._id
        )?.length > 0 ? (
          interactions?.attachments
            .filter(
              (attachment) =>
                !attachment.lessonId ||
                attachment.lessonId === currentLesson?._id
            )
            .map((attachment) => (
              <div
                key={attachment._id}
                className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 hover:shadow-md bg-gradient-to-r from-gray-50 to-white"
              >
                <div className="flex items-center">
                  {/* File type icon */}
                  {attachment?.fileType?.toLowerCase() === "pdf" ? (
                    <svg
                      className="h-6 w-6 text-red-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : attachment?.fileType?.toLowerCase() === "doc" ||
                    attachment?.fileType?.toLowerCase() === "docx" ? (
                    <svg
                      className="h-6 w-6 text-blue-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : attachment?.fileType?.toLowerCase() === "ppt" ||
                    attachment?.fileType?.toLowerCase() === "pptx" ? (
                    <svg
                      className="h-6 w-6 text-orange-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : attachment?.fileType?.toLowerCase() === "zip" ? (
                    <svg
                      className="h-6 w-6 text-purple-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : attachment?.fileType?.toLowerCase() === "jpg" ||
                    attachment?.fileType?.toLowerCase() === "jpeg" ||
                    attachment?.fileType?.toLowerCase() === "png" ||
                    attachment?.fileType?.toLowerCase() === "gif" ? (
                    <svg
                      className="h-6 w-6 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : attachment?.fileType?.toLowerCase() === "mp4" ||
                    attachment?.fileType?.toLowerCase() === "mov" ||
                    attachment?.fileType?.toLowerCase() === "avi" ? (
                    <div className="h-6 w-6 text-purple-500 mr-3 flex items-center justify-center">
                      🎥
                    </div>
                  ) : attachment?.fileType?.toLowerCase() === "mp3" ||
                    attachment?.fileType?.toLowerCase() === "wav" ? (
                    <div className="h-6 w-6 text-orange-500 mr-3 flex items-center justify-center">
                      🎵
                    </div>
                  ) : (
                    <svg
                      className="h-6 w-6 text-gray-400 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}
                  <div>
                    <h3 className="font-medium">
                      {attachment?.title || "Untitled"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {attachment?.fileType?.toUpperCase() || "FILE"} •{" "}
                      {attachment?.fileSize
                        ? `${(
                            attachment.fileSize /
                            1024 /
                            1024
                          ).toFixed(2)} MB`
                        : "Unknown size"}
                      {!attachment?.lessonId && (
                        <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          General
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {attachment?.fileUrl && (
                    <a
                      href={getDownloadUrl(
                        attachment.fileUrl,
                        attachment?.title || "download",
                        attachment.fileType
                      )}
                      download={ensureFileExtension(
                        attachment?.title || "download",
                        attachment.fileType
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title={`Download ${attachment?.title || "file"}`}
                    >
                      <Download size={16} />
                    </a>
                  )}
                  {(user?.role === "admin" ||
                    attachment?.uploadedBy?._id === user?._id) && (
                    <button
                      onClick={() =>
                        removeAttachment({
                          courseId,
                          attachmentId: attachment._id,
                        })
                      }
                      className="text-red-600 hover:text-red-800"
                      aria-label="Remove attachment"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-gray-500 text-lg">No materials uploaded yet.</p>
            <p className="text-gray-400 text-sm mt-2">Materials will appear here when uploaded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttachmentSection;
