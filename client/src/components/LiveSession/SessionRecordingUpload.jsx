/**
 * Session Recording Upload Component
 * 
 * Allows instructors to upload recording links for completed sessions
 */

import React, { useState } from 'react';
import { useUploadSessionRecordingMutation } from '../../store/services/liveSessionApi';
import { toast } from 'react-toastify';

const SessionRecordingUpload = ({ session, onSuccess, onCancel }) => {
  const [uploadRecording, { isLoading }] = useUploadSessionRecordingMutation();

  const [formData, setFormData] = useState({
    recordingUrl: '',
    recordingPassword: '',
    isRecordingPublic: false
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.recordingUrl.trim()) {
      newErrors.recordingUrl = 'Recording URL is required';
    } else {
      try {
        new URL(formData.recordingUrl);
      } catch {
        newErrors.recordingUrl = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await uploadRecording({
        sessionId: session._id,
        recordingData: formData
      }).unwrap();
      
      toast.success('Recording uploaded successfully! 🎉');
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Error uploading recording:', error);
      toast.error(error?.data?.message || 'Failed to upload recording');
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              📹 Upload Session Recording
            </h2>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-1">{session.title}</h3>
              <p className="text-sm text-gray-600">
                {new Date(session.scheduledDate).toLocaleDateString()} • {session.duration} minutes
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recording URL */}
            <div>
              <label htmlFor="recordingUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                Recording URL *
              </label>
              <input
                type="url"
                id="recordingUrl"
                name="recordingUrl"
                value={formData.recordingUrl}
                onChange={handleInputChange}
                placeholder="https://zoom.us/rec/share/... or https://drive.google.com/..."
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  errors.recordingUrl ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              />
              {errors.recordingUrl && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.recordingUrl}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                💡 Supported platforms: Zoom, Google Drive, YouTube, Vimeo, or any direct video link
              </p>
            </div>

            {/* Recording Password */}
            <div>
              <label htmlFor="recordingPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Recording Password (Optional)
              </label>
              <input
                type="text"
                id="recordingPassword"
                name="recordingPassword"
                value={formData.recordingPassword}
                onChange={handleInputChange}
                placeholder="Enter password if recording is protected"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 hover:border-gray-300 transition-colors"
                maxLength={20}
              />
              <p className="mt-1 text-sm text-gray-500">
                If your recording requires a password, enter it here so students can access it
              </p>
            </div>

            {/* Public Recording Toggle */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="isRecordingPublic"
                  name="isRecordingPublic"
                  checked={formData.isRecordingPublic}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <label htmlFor="isRecordingPublic" className="font-medium text-gray-700">
                    Make recording publicly accessible
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.isRecordingPublic 
                      ? '🌐 Anyone with the link can access this recording'
                      : '🔒 Only enrolled students can access this recording'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Recording Guidelines */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-800 mb-2">📋 Recording Guidelines</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ensure the recording is accessible to students</li>
                <li>• Include any necessary passwords or access instructions</li>
                <li>• Consider the recording quality and audio clarity</li>
                <li>• Remove any sensitive information before sharing</li>
              </ul>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📹</span>
                    Upload Recording
                  </>
                )}
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 sm:flex-none px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SessionRecordingUpload;
