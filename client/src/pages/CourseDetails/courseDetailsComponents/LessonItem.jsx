import React from "react";
import {
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

const LessonItem = ({
  lesson,
  lessonAttachments,
  currentUser,
  courseId,
  navigate,
  handleUploadAttachment,
  handleDelete,
  handleDeleteAttachment,
  isLoading,
  uploadProgress,
  getDownloadUrl,
  ensureFileExtension,
}) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 border">{lesson.title}</td>
      <td className="px-4 py-2 border">{lesson.duration} mins</td>
      <td className="px-4 py-2 border">
        <div className="space-y-2">
          {/* Upload button for instructors and admins */}
          {(currentUser?.role === "instructor" ||
            currentUser?.role === "admin") && (
            <div className="mb-2">
              <label className="cursor-pointer bg-[rgb(48,146,85)] text-white px-2 py-1 rounded text-xs hover:bg-[rgb(33,98,58)] transition-colors flex items-center space-x-1">
                <Upload size={12} />
                <span>
                  {isLoading ? `Uploading... ${uploadProgress}%` : "Upload"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleUploadAttachment(e, lesson._id)}
                  disabled={isLoading}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.ppt,.pptx,.mp4,.mov,.avi,.mp3,.wav"
                />
              </label>
            </div>
          )}

          {/* Attachments list */}
          {lessonAttachments.length > 0 ? (
            <div className="space-y-1">
              {lessonAttachments.map((attachment) => (
                <div
                  key={attachment._id}
                  className="flex items-center justify-between space-x-2 text-sm"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {/* File type icon */}
                    {attachment?.fileType?.toLowerCase() === "pdf" ? (
                      <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                    ) : attachment?.fileType?.toLowerCase() === "doc" ||
                      attachment?.fileType?.toLowerCase() === "docx" ? (
                      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : attachment?.fileType?.toLowerCase() === "jpg" ||
                      attachment?.fileType?.toLowerCase() === "jpeg" ||
                      attachment?.fileType?.toLowerCase() === "png" ||
                      attachment?.fileType?.toLowerCase() === "gif" ? (
                      <Image className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : attachment?.fileType?.toLowerCase() === "mp4" ||
                      attachment?.fileType?.toLowerCase() === "mov" ||
                      attachment?.fileType?.toLowerCase() === "avi" ? (
                      <Video className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    ) : attachment?.fileType?.toLowerCase() === "mp3" ||
                      attachment?.fileType?.toLowerCase() === "wav" ? (
                      <Music className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    ) : attachment?.fileType?.toLowerCase() === "zip" ? (
                      <Archive className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    ) : (
                      <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="text-[rgb(48,146,85)] hover:text-[rgb(33,98,58)] truncate">
                        {attachment.title}
                      </span>
                      <a
                        href={getDownloadUrl(
                          attachment.fileUrl,
                          attachment.title,
                          attachment.fileType
                        )}
                        download={ensureFileExtension(
                          attachment.title,
                          attachment.fileType
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title={`Download ${attachment.title}`}
                      >
                        <Download size={14} />
                      </a>
                    </div>
                    {!attachment.lessonId && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-1 py-0.5 rounded flex-shrink-0">
                        General
                      </span>
                    )}
                  </div>

                  {/* Delete button for instructors and admins */}
                  {(currentUser?.role === "instructor" ||
                    currentUser?.role === "admin") && (
                    <button
                      onClick={() => handleDeleteAttachment(attachment._id)}
                      className="text-red-600 hover:text-red-800 text-xs px-1 py-0.5 rounded hover:bg-red-50 transition-colors"
                      title="Delete attachment"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 text-sm">No attachments</span>
          )}
        </div>
      </td>
      {(currentUser?.role === "instructor" ||
        currentUser?.role === "admin") && (
        <td className="px-4 py-2 border text-center">
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() =>
                navigate(`/lessons/${lesson._id}/edit`, {
                  state: { courseId },
                })
              }
              className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
              title="Edit lesson"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => handleDelete(lesson._id)}
              className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition-colors"
              title="Delete lesson"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
};

export default LessonItem;
