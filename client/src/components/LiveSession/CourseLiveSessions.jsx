/**
 * Course Live Sessions Component
 * 
 * Displays live sessions for a specific course in the course details page
 */

import React, { useState } from 'react';
import { 
  useGetSessionsByCourseQuery,
  useJoinLiveSessionMutation,
  useDeleteLiveSessionMutation 
} from '../../store/services/liveSessionApi';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

const CourseLiveSessions = ({ courseId, isEnrolled = false }) => {
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);

  const { 
    data: sessionsData, 
    isLoading, 
    error 
  } = useGetSessionsByCourseQuery({
    courseId,
    upcoming: showAll ? undefined : 'true'
  });

  const [joinSession, { isLoading: isJoining }] = useJoinLiveSessionMutation();
  const [deleteSession, { isLoading: isDeleting }] = useDeleteLiveSessionMutation();

  const sessions = sessionsData?.data || [];
  const displaySessions = showAll ? sessions : sessions.slice(0, 3);

  const handleJoinSession = async (sessionId) => {
    // Allow instructors to join their own sessions even if not "enrolled"
    if (!isEnrolled && user?.role !== 'instructor') {
      toast.error('You must be enrolled in this course to join live sessions');
      return;
    }

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

  const handleDeleteSession = async (sessionId, sessionTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${sessionTitle}"? This action cannot be undone.`)) {
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

  const getStatusBadge = (session) => {
    const status = session.currentStatus || session.status;
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      live: 'bg-green-100 text-green-800 animate-pulse',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      ended: 'bg-purple-100 text-purple-800'
    };

    const icons = {
      upcoming: '⏰',
      live: '🔴',
      completed: '✅',
      cancelled: '❌',
      ended: '🏁'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badges[status] || badges.upcoming}`}>
        <span className="mr-1">{icons[status] || icons.upcoming}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const canJoinSession = (session) => {
    // Allow instructors to join their own sessions, or enrolled students
    if (!isEnrolled && user?.role !== 'instructor') return false;
    
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">🎥</span>
          Live Sessions
        </h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">🎥</span>
          Live Sessions
        </h3>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-gray-600">Failed to load live sessions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">🎥</span>
          Live Sessions
          {sessions.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
              {sessions.length}
            </span>
          )}
        </h3>
        {sessions.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showAll ? 'Show Less' : 'Show All'}
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📅</div>
          <p className="text-gray-600">No live sessions scheduled yet</p>
          {user?.role === 'instructor' && (
            <p className="text-sm text-gray-500 mt-2">
              Schedule your first live session to engage with students
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displaySessions.map(session => {
            const status = session.currentStatus || session.status;
            
            return (
              <div key={session._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Live Session Alert */}
                {status === 'live' && (
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-center py-2 px-4 rounded-lg mb-3 font-semibold animate-pulse">
                    🔴 LIVE NOW
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-800 text-lg">
                        {session.title}
                      </h4>
                      {getStatusBadge(session)}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {session.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        {new Date(session.scheduledDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">⏰</span>
                        {new Date(session.scheduledDate).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">⏱️</span>
                        {session.duration} minutes
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">👥</span>
                        {session.participantCount || 0}/{session.maxParticipants}
                      </div>
                    </div>

                    {status === 'upcoming' && (
                      <div className="mt-2 text-sm text-blue-600 font-medium">
                        <span className="mr-1">⏳</span>
                        Starts in {getTimeUntilSession(session.scheduledDate)}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-col gap-2 min-w-[120px]">
                    {canJoinSession(session) && (
                      <button
                        onClick={() => handleJoinSession(session._id)}
                        disabled={isJoining}
                        className="bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {isJoining ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Joining...
                          </>
                        ) : (
                          <>
                            <span className="mr-1">🚀</span>
                            Join
                          </>
                        )}
                      </button>
                    )}

                    {!isEnrolled && user?.role !== 'instructor' && canJoinSession(session) && (
                      <div className="text-xs text-gray-500 text-center">
                        Enroll to join
                      </div>
                    )}

                    {session.recordingUrl && (status === 'completed' || status === 'ended') && (
                      <button
                        onClick={() => window.open(session.recordingUrl, '_blank')}
                        className="bg-purple-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors flex items-center justify-center"
                      >
                        <span className="mr-1">🎬</span>
                        Recording
                      </button>
                    )}

                    {status === 'upcoming' && !canJoinSession(session) && (
                      <div className="text-xs text-gray-500 text-center">
                        Available 1hr before
                      </div>
                    )}

                    {/* Delete Button - Only for instructors */}
                    {user?.role === 'instructor' && (status === 'scheduled' || status === 'upcoming' || status === 'cancelled') && (
                      <button
                        onClick={() => handleDeleteSession(session._id, session.title)}
                        disabled={isDeleting}
                        className="bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {isDeleting ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <span className="mr-1">🗑️</span>
                            Delete
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isEnrolled && user?.role !== 'instructor' && sessions.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center text-blue-800">
            <span className="mr-2">ℹ️</span>
            <span className="text-sm font-medium">
              Enroll in this course to join live sessions and access recordings
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseLiveSessions;
