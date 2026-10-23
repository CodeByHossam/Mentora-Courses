/**
 * Schedule Session Form Component
 * 
 * Allows instructors to schedule new live sessions
 */

import React, { useState } from 'react';
import { useCreateLiveSessionMutation } from '../../store/services/liveSessionApi';
import { toast } from 'react-toastify';

const ScheduleSessionForm = ({ courseId, onSuccess, onCancel }) => {
  const [createLiveSession, { isLoading }] = useCreateLiveSessionMutation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    duration: 60,
    sessionType: 'lecture',
    maxParticipants: 100,
    instructorNotes: ''
  });

  const [errors, setErrors] = useState({});

  const sessionTypes = [
    { value: 'lecture', label: '📚 Lecture' },
    { value: 'workshop', label: '🛠️ Workshop' },
    { value: 'qa', label: '❓ Q&A Session' },
    { value: 'review', label: '📝 Review Session' },
    { value: 'exam', label: '📋 Exam' }
  ];

  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 240, label: '4 hours' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Session title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Session description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date and time is required';
    } else {
      const scheduledDate = new Date(formData.scheduledDate);
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      
      if (scheduledDate <= oneHourFromNow) {
        newErrors.scheduledDate = 'Session must be scheduled at least 1 hour in advance';
      }
    }

    if (!formData.duration || formData.duration < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      const sessionData = {
        ...formData,
        courseId,
        duration: parseInt(formData.duration),
        maxParticipants: parseInt(formData.maxParticipants)
      };

      const result = await createLiveSession(sessionData).unwrap();
      
      toast.success('Live session scheduled successfully! 🎉');
      
      if (onSuccess) {
        onSuccess(result.data);
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        scheduledDate: '',
        duration: 60,
        sessionType: 'lecture',
        maxParticipants: 100,
        instructorNotes: ''
      });
      
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast.error(error?.data?.message || 'Failed to schedule session');
    }
  };

  // Get minimum date-time (1 hour from now)
  const getMinDateTime = () => {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    return oneHourFromNow.toISOString().slice(0, 16);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          📅 Schedule Live Session
        </h2>
        <p className="text-gray-600">
          Create a new live session for your students
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Session Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            Session Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter session title"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            maxLength={100}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.title}
            </p>
          )}
        </div>

        {/* Session Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe what will be covered in this session"
            rows={4}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${
              errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description ? (
              <p className="text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.description}
              </p>
            ) : (
              <div />
            )}
            <span className="text-sm text-gray-500">
              {formData.description.length}/1000
            </span>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-semibold text-gray-700 mb-2">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              id="scheduledDate"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleInputChange}
              min={getMinDateTime()}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.scheduledDate ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            />
            {errors.scheduledDate && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.scheduledDate}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-semibold text-gray-700 mb-2">
              Duration *
            </label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.duration ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {durationOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.duration && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠️</span>
                {errors.duration}
              </p>
            )}
          </div>
        </div>

        {/* Session Type and Max Participants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="sessionType" className="block text-sm font-semibold text-gray-700 mb-2">
              Session Type
            </label>
            <select
              id="sessionType"
              name="sessionType"
              value={formData.sessionType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors"
            >
              {sessionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="maxParticipants" className="block text-sm font-semibold text-gray-700 mb-2">
              Max Participants
            </label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleInputChange}
              min={1}
              max={500}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors"
            />
          </div>
        </div>

        {/* Instructor Notes */}
        <div>
          <label htmlFor="instructorNotes" className="block text-sm font-semibold text-gray-700 mb-2">
            Instructor Notes (Optional)
          </label>
          <textarea
            id="instructorNotes"
            name="instructorNotes"
            value={formData.instructorNotes}
            onChange={handleInputChange}
            placeholder="Private notes for your reference"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors resize-none"
            maxLength={2000}
          />
          <div className="mt-1 text-right">
            <span className="text-sm text-gray-500">
              {formData.instructorNotes.length}/2000
            </span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Scheduling...
              </>
            ) : (
              <>
                <span className="mr-2">📅</span>
                Schedule Session
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
  );
};

export default ScheduleSessionForm;
