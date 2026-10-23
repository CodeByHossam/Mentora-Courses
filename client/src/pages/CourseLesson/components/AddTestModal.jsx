import React from 'react';
import { X } from 'lucide-react';

const AddTestModal = ({ 
  showAddTestModal, 
  setShowAddTestModal, 
  testForm, 
  testFormError, 
  isAddingTest, 
  handleTestFormChange, 
  handleAddTest 
}) => {
  if (!showAddTestModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative transform transition-all">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => setShowAddTestModal(false)}
          aria-label="Close"
        >
          <X size={24} />
        </button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📝</div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Test</h2>
          <p className="text-gray-600 text-sm">Create a test for your students</p>
        </div>
        {testFormError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {testFormError}
          </div>
        )}
        <form onSubmit={handleAddTest} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">📋 Test Title *</label>
            <input
              type="text"
              name="title"
              value={testForm.title}
              onChange={handleTestFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter test title..."
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">📄 Description</label>
            <textarea
              name="description"
              value={testForm.description}
              onChange={handleTestFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={3}
              placeholder="Describe the test..."
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">📅 Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={testForm.dueDate}
              onChange={handleTestFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">🎯 Test Type *</label>
            <select
              name="testType"
              value={testForm.testType}
              onChange={handleTestFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            >
              <option value="progress">📝 Progress Test</option>
              <option value="final">🎯 Final Test</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Progress tests are for regular assessments. Final tests are for course completion evaluation.
            </p>
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">🎯 Total Points *</label>
            <input
              type="number"
              name="totalPoints"
              value={testForm.totalPoints}
              onChange={handleTestFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter maximum score (e.g., 100)"
              min="1"
              max="1000"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum score/points that students can earn on this test.
            </p>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">📎 Test File *</label>
            <input
              type="file"
              name="testFile"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.ppt,.pptx,.mp4,.mov,.avi,.mp3,.wav"
              onChange={handleTestFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isAddingTest}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transform hover:scale-105 disabled:transform-none"
          >
            {isAddingTest ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Adding Test...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="mr-2">🚀</span>
                Add Test
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTestModal;
