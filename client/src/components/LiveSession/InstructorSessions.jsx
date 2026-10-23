/**
 * Instructor Sessions Component
 * 
 * Displays and manages instructor's live sessions
 */

import React, { useState, useEffect } from 'react';
import { 
  useGetInstructorSessionsQuery,
  useStartLiveSessionMutation,
  useEndLiveSessionMutation,
  useDeleteLiveSessionMutation,
  useJoinLiveSessionMutation 
} from '../../store/services/liveSessionApi';
import { toast } from 'react-toastify';
import ScheduleSessionForm from './ScheduleSessionForm';
import SessionRecordingUpload from './SessionRecordingUpload';

const InstructorSessions = ({ courseId }) => {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showRecordingUpload, setShowRecordingUpload] = useState(false);
  const [filter, setFilter] = useState('all');

  const { 
    data: sessionsData, 
    isLoading, 
    error,
    refetch 
  } = useGetInstructorSessionsQuery({
    status: filter === 'all' ? undefined : filter,
    upcoming: filter === 'upcoming' ? 'true' : undefined
  }, {
    // Poll every 30 seconds to get real-time updates
    pollingInterval: 30000,
    // Refetch when window regains focus
    refetchOnFocus: true,
    // Refetch when reconnecting
    refetchOnReconnect: true
  });

  const [startSession, { isLoading: isStarting }] = useStartLiveSessionMutation();
  const [endSession, { isLoading: isEnding }] = useEndLiveSessionMutation();
  const [deleteSession, { isLoading: isDeleting }] = useDeleteLiveSessionMutation();
  const [joinSession, { isLoading: isJoining }] = useJoinLiveSessionMutation();

  const sessions = sessionsData?.data || [];

  const handleStartSession = async (sessionId) => {
    try {
      const result = await startSession(sessionId).unwrap();
      toast.success('Session started successfully! 🎉');
      
      // Open Zoom start URL in new tab
      if (result.data?.zoomStartUrl) {
        window.open(result.data.zoomStartUrl, '_blank');
      }
      
      // Force refresh to show updated status immediately
      refetch();
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error(error?.data?.message || 'Failed to start session');
    }
  };

  const handleEndSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to end this session?')) {
      return;
    }

    try {
      await endSession(sessionId).unwrap();
      toast.success('Session ended successfully');
      // Force refresh to show updated status immediately
      refetch();
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error(error?.data?.message || 'Failed to end session');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteSession(sessionId).unwrap();
      toast.success('Session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(error?.data?.message || 'Failed to delete session');
    }
  };

  const handleJoinSession = async (sessionId) => {
    try {
      const result = await joinSession(sessionId).unwrap();
      toast.success('Joined session successfully! 🎉');
      
      // Open Zoom join URL in new tab
      if (result.data?.zoomJoinUrl) {
        window.open(result.data.zoomJoinUrl, '_blank');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error(error?.data?.message || 'Failed to join session');
    }
  };

  const handleUploadRecording = (session) => {
    setSelectedSession(session);
    setShowRecordingUpload(true);
  };

  const getStatusBadge = (session) => {
    // Check for real-time status first, then fall back to stored status
    const status = session.currentStatus || session.status || 'scheduled';
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
      live: 'bg-green-100 text-green-800 border-green-200 animate-pulse',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      ended: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    const icons = {
      scheduled: '📅',
      upcoming: '⏰',
      live: '🔴',
      completed: '✅',
      cancelled: '❌',
      ended: '🏁'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${badges[status] || badges.scheduled}`}>
        <span className="mr-1">{icons[status] || icons.scheduled}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
        {status === 'live' && <span className="ml-1 animate-ping">●</span>}
      </span>
    );
  };

  const getTimeUntilSession = (scheduledDate) => {
    const now = new Date();
    const sessionTime = new Date(scheduledDate);
    const timeDiff = sessionTime.getTime() - now.getTime();

    if (timeDiff <= 0) return 'Started';

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const canStartSession = (session) => {
    const now = new Date();
    const sessionStart = new Date(session.scheduledDate);
    const canStartTime = new Date(sessionStart.getTime() - 60 * 60 * 1000); // 1 hour before (consistent with join)
    
    return session.status === 'scheduled' && now >= canStartTime;
  };

  const canJoinSession = (session) => {
    const now = new Date();
    const sessionStart = new Date(session.scheduledDate);
    const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60 * 1000);
    const canJoinTime = new Date(sessionStart.getTime() - 60 * 60 * 1000); // 1 hour before (for testing)
    
    return (
      (session.status === 'scheduled' || session.status === 'live') &&
      now >= canJoinTime &&
      now <= sessionEnd
    );
  };

  if (showScheduleForm) {
    return (
      <ScheduleSessionForm
        courseId={courseId}
        onSuccess={() => {
          setShowScheduleForm(false);
          refetch();
        }}
        onCancel={() => setShowScheduleForm(false)}
      />
    );
  }

  if (showRecordingUpload && selectedSession) {
    return (
      <SessionRecordingUpload
        session={selectedSession}
        onSuccess={() => {
          setShowRecordingUpload(false);
          setSelectedSession(null);
          refetch();
        }}
        onCancel={() => {
          setShowRecordingUpload(false);
          setSelectedSession(null);
        }}
      />
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🎥 Live Sessions
              </h1>
              <p className="text-gray-600">
                Manage your scheduled and completed live sessions
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <button
                onClick={refetch}
                className="bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center"
                title="Refresh sessions"
              >
                <span className="mr-2">🔄</span>
                Refresh
              </button>
              <button
                onClick={() => setShowScheduleForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center"
              >
                <span className="mr-2">➕</span>
                Schedule New Session
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'all', label: '📋 All Sessions' },
              { key: 'upcoming', label: '⏰ Upcoming' },
              { key: 'scheduled', label: '📅 Scheduled' },
              { key: 'live', label: '🔴 Live' },
              { key: 'completed', label: '✅ Completed' }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  filter === filterOption.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sessions...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Sessions</h3>
            <p className="text-gray-600 mb-4">{error?.data?.message || 'Something went wrong'}</p>
            <button
              onClick={refetch}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Sessions Found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't scheduled any live sessions yet."
                : `No ${filter} sessions found.`
              }
            </p>
            <button
              onClick={() => setShowScheduleForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              Schedule Your First Session
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {sessions.map(session => (
              <div key={session._id} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {session.title}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {session.description}
                        </p>
                      </div>
                      {getStatusBadge(session)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">📅</span>
                        {new Date(session.scheduledDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">⏰</span>
                        {new Date(session.scheduledDate).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">⏱️</span>
                        {session.duration} minutes
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">👥</span>
                        {session.participantCount || 0}/{session.maxParticipants} participants
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">📚</span>
                        {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)}
                      </div>
                      {session.status === 'scheduled' && (
                        <div className="flex items-center text-blue-600 font-medium">
                          <span className="mr-2">⏳</span>
                          Starts in {getTimeUntilSession(session.scheduledDate)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 lg:mt-0 lg:ml-6 flex flex-wrap gap-3">
                    {session.status === 'scheduled' && canStartSession(session) && (
                      <>
                        <button
                          onClick={() => handleStartSession(session._id)}
                          disabled={isStarting}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 flex items-center"
                        >
                          <span className="mr-2">🚀</span>
                          {isStarting ? 'Starting...' : 'Start Session'}
                        </button>
                        {canJoinSession(session) && (
                          <button
                            onClick={() => handleJoinSession(session._id)}
                            disabled={isJoining}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center"
                          >
                            <span className="mr-2">🔗</span>
                            {isJoining ? 'Joining...' : 'Join as Participant'}
                          </button>
                        )}
                      </>
                    )}

                    {session.status === 'live' && (
                      <>
                        <button
                          onClick={() => handleJoinSession(session._id)}
                          disabled={isJoining}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 flex items-center"
                        >
                          <span className="mr-2">🚀</span>
                          {isJoining ? 'Joining...' : 'Join Session'}
                        </button>
                        <button
                          onClick={() => handleEndSession(session._id)}
                          disabled={isEnding}
                          className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 flex items-center"
                        >
                          <span className="mr-2">⏹️</span>
                          {isEnding ? 'Ending...' : 'End Session'}
                        </button>
                      </>
                    )}

                    {session.zoomJoinUrl && (session.status === 'live' || session.status === 'scheduled') && (
                      <button
                        onClick={() => window.open(session.zoomJoinUrl, '_blank')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center"
                      >
                        <span className="mr-2">🔗</span>
                        Join URL
                      </button>
                    )}

                    {session.status === 'completed' && !session.recordingUrl && (
                      <button
                        onClick={() => handleUploadRecording(session)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors flex items-center"
                      >
                        <span className="mr-2">📹</span>
                        Upload Recording
                      </button>
                    )}

                    {session.recordingUrl && (
                      <button
                        onClick={() => window.open(session.recordingUrl, '_blank')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors flex items-center"
                      >
                        <span className="mr-2">🎬</span>
                        View Recording
                      </button>
                    )}

                    {(session.status === 'scheduled' || session.status === 'cancelled') && (
                      <button
                        onClick={() => handleDeleteSession(session._id)}
                        disabled={isDeleting}
                        className="bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 flex items-center"
                      >
                        <span className="mr-2">🗑️</span>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorSessions;
