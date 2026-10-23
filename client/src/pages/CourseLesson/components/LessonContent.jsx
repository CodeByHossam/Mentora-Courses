import React from 'react';
import { toast } from 'react-toastify';
import VideoPlayer from '../../../components/VideoPlayer';

const LessonContent = ({ currentLesson }) => {
  return (
    <div className="flex-1">
      {/* Secure Video Player */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl overflow-hidden aspect-video mb-6 border border-gray-200">
        {currentLesson?._id ? (
          <VideoPlayer 
            lessonId={currentLesson._id}
            autoplay={false}
            className="w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-xl font-medium">No lesson selected</p>
              <p className="text-gray-300 text-sm mt-2">Please select a lesson from the sidebar</p>
            </div>
          </div>
        )}
      </div>

      {/* Lesson Content */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
        <div className="flex items-center mb-6">
          <div className="text-3xl mr-3">📖</div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {currentLesson?.title || "Lesson Content"}
          </h2>
        </div>
        <div className="prose max-w-none">
          {currentLesson?.content ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <p className="text-gray-700 leading-relaxed text-lg">
                {currentLesson.content}
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-500 text-lg">No content available for this lesson.</p>
              <p className="text-gray-400 text-sm mt-2">Content will be added by your instructor</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonContent;
