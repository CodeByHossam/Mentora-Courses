import React from 'react';
import { Plus, Download } from 'lucide-react';

const TestSection = ({ 
  user, 
  interactions, 
  setShowAddTestModal, 
  handleTestSubmit, 
  handleDeleteTestAnswer, 
  isDeletingTestAnswer 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="text-3xl mr-3">📝</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Tests & Assignments
          </h2>
        </div>
        {user?.role === "instructor" && (
          <button
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium transform hover:scale-105 shadow-lg"
            onClick={() => setShowAddTestModal(true)}
          >
            <Plus size={18} /> 
            <span>Add Test</span>
          </button>
        )}
      </div>
      {interactions?.tests?.length > 0 ? (
        <div className="space-y-6">
          {interactions?.tests.map((test) => {
            // Find the student's submission for this test (if any)
            const studentSubmission =
              user?.role === "student"
                ? test.submissions?.find(
                    (sub) =>
                      sub.student?._id === user?.id ||
                      sub.student === user?.id
                  )
                : null;
            return (
              <div
                key={test._id}
                className="border border-gray-200 rounded-xl p-6 bg-gradient-to-r from-purple-50 to-indigo-50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                      <span className="mr-2">📋</span>
                      {test?.title || "Untitled Test"}
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {test?.description || "No description provided"}
                    </p>
                    {test?.dueDate && (
                      <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-lg inline-flex mb-4">
                        <span className="mr-1">⏰</span>
                        Due: {new Date(test.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Test file download link */}
                {test?.fileUrl && (
                  <div className="mb-4">
                    <a
                      href={test.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium transform hover:scale-105"
                      download
                    >
                      <Download size={16} className="mr-2" /> 
                      Download Test File
                    </a>
                  </div>
                )}
                
                {/* Student's answer file link (if any) */}
                {user?.role === "student" &&
                  studentSubmission?.answerFileUrl && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-green-700 font-medium mr-3 flex items-center">
                            <span className="mr-1">✅</span>
                            Your Submission:
                          </span>
                          <a
                            href={studentSubmission.answerFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
                            download
                          >
                            <Download size={16} className="mr-1" /> 
                            Download Answer
                          </a>
                        </div>
                        <button
                          className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-all text-sm font-medium"
                          disabled={isDeletingTestAnswer}
                          onClick={() =>
                            handleDeleteTestAnswer(
                              test._id,
                              studentSubmission._id
                            )
                          }
                          title="Delete your answer"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )}
                
                {/* Upload answer */}
                {user?.role === "student" && !studentSubmission?.answerFileUrl && (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 hover:bg-green-50 transition-all duration-200">
                      <div className="text-3xl mb-2">📤</div>
                      <p className="text-gray-600 font-medium">Click to upload your answer</p>
                      <p className="text-gray-400 text-sm mt-1">Drag and drop or click to browse</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleTestSubmit(test?._id, e.target.files[0])
                      }
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-500 text-lg">No tests available yet.</p>
          <p className="text-gray-400 text-sm mt-2">Tests and assignments will appear here when added</p>
        </div>
      )}
    </div>
  );
};

export default TestSection;
