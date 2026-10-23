import React from "react";
import { Plus } from "lucide-react";
import TestItem from "./TestItem";

const TestList = ({
  tests = [],
  course,
  currentUser,
  courseId,
  setShowAddTestModal,
  handleTestSubmit,
  handleDeleteTestAnswer,
  isDeletingTestAnswer,
  toast,
  lessons = [],
  isEnrolled = false,
}) => {
  // Helper to get lesson name by id
  const getLessonName = (lessonId) => {
    if (!lessonId || !lessons) return "-";
    const lesson = lessons.find((l) => l._id === lessonId);
    return lesson ? lesson.title : "-";
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        {(currentUser?.role === "instructor" || currentUser?.role === "admin") && (
          <button
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={() => setShowAddTestModal(true)}
          >
            <Plus size={18} />
            <span className="font-semibold">Add New Test</span>
          </button>
        )}
      </div>
      {tests?.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[900px] bg-white">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Test Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Lesson</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tests.map((test) => {
                // If the current user is a student, show their submission
                const studentSubmission =
                  currentUser?.role === "student"
                    ? test.submissions?.find(
                        (sub) =>
                          sub.student?._id === currentUser?.id ||
                          sub.student === currentUser?.id
                      )
                    : null;
                return (
                  <TestItem
                    key={test._id}
                    test={test}
                    studentSubmission={studentSubmission}
                    currentUser={currentUser}
                    courseId={courseId}
                    handleTestSubmit={handleTestSubmit}
                    handleDeleteTestAnswer={handleDeleteTestAnswer}
                    isDeletingTestAnswer={isDeletingTestAnswer}
                    toast={toast}
                    lessonName={getLessonName(test.lesson)}
                    isEnrolled={isEnrolled}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No tests found for this course</p>
        </div>
      )}
    </div>
  );
};

export default TestList;
