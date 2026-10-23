import React, { useState } from "react";
import { useGetStudentInstructorsQuery, useSendMessageMutation } from "../store/services/messageApi";
import { MessageSquare, User, X, Send, BookOpen } from "lucide-react";
import { toast } from "react-toastify";

const StartConversation = ({ isOpen, onClose, preSelectedInstructor = null, preSelectedCourse = null }) => {
  const [selectedInstructor, setSelectedInstructor] = useState(preSelectedInstructor);
  const [selectedCourse, setSelectedCourse] = useState(preSelectedCourse);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data: instructorsData, isLoading } = useGetStudentInstructorsQuery();
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  const instructors = instructorsData?.data || [];

  const handleSendMessage = async () => {
    if (!selectedInstructor || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await sendMessage({
        receiverId: selectedInstructor._id,
        subject: subject.trim(),
        content: message.trim(),
        courseId: selectedCourse?._id,
        messageType: "course_related",
        priority: "normal",
      }).unwrap();

      toast.success("Message sent successfully!");
      setSubject("");
      setMessage("");
      setSelectedInstructor(preSelectedInstructor);
      setSelectedCourse(preSelectedCourse);
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleInstructorSelect = (instructor) => {
    setSelectedInstructor(instructor);
    // If there's only one course with this instructor, auto-select it
    if (instructor.courses.length === 1) {
      setSelectedCourse(instructor.courses[0]);
    } else {
      setSelectedCourse(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Start New Conversation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading instructors...</p>
            </div>
          ) : (
            <>
              {/* Select Instructor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Instructor
                </label>
                <div className="grid gap-3">
                  {instructors.map((instructor) => (
                    <div
                      key={instructor._id}
                      onClick={() => handleInstructorSelect(instructor)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedInstructor?._id === instructor._id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{instructor.name}</h3>
                          <p className="text-sm text-gray-600">{instructor.email}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {instructor.courses.map((course) => (
                              <span
                                key={course._id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                <BookOpen className="w-3 h-3 mr-1" />
                                {course.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {instructors.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No instructors found. You need to be enrolled in courses to message instructors.</p>
                  </div>
                )}
              </div>

              {/* Select Course (if instructor has multiple courses) */}
              {selectedInstructor && selectedInstructor.courses.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Course (Optional)
                  </label>
                  <div className="grid gap-2">
                    <div
                      onClick={() => setSelectedCourse(null)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        !selectedCourse
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-sm font-medium">General Message</span>
                    </div>
                    {selectedInstructor.courses.map((course) => (
                      <div
                        key={course._id}
                        onClick={() => setSelectedCourse(course)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedCourse?._id === course._id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-sm font-medium">{course.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject */}
              {selectedInstructor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter message subject..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Message */}
              {selectedInstructor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {selectedInstructor && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!subject.trim() || !message.trim() || isSending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isSending ? "Sending..." : "Send Message"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartConversation;
