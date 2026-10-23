/**
 * Student Sessions Component
 * 
 * Displays upcoming and past live sessions for students
 */

import React, { useState, useEffect } from 'react';
import { 
  useGetStudentSessionsQuery,
  useJoinLiveSessionMutation,
  useLeaveLiveSessionMutation 
} from '../../store/services/liveSessionApi';
import { toast } from 'react-toastify';

const StudentSessions = () => {
  const [filter, setFilter] = useState('upcoming');
  const [joinedSessions, setJoinedSessions] = useState(new Set());

  const { 
    data: sessionsData, 
    isLoading, 
    error,
    refetch 
  } = useGetStudentSessionsQuery({
    upcoming: filter === 'upcoming' ? 'true' : undefined
  });

  const [joinSession, { isLoading: isJoining }] = useJoinLiveSessionMutation();
  const [leaveSession, { isLoading: isLeaving }] = useLeaveLiveSessionMutation();

  const sessions = sessionsData?.data || [];

  // Auto-refresh every minute for live sessions
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 60000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleJoinSession = async (sessionId) => {
    try {
      const result = await joinSession(sessionId).unwrap();
      toast.success('Joined session successfully! 🎉');
      
      setJoinedSessions(prev => new Set([...prev, sessionId]));
      
      // Open Zoom join URL in new tab
      if (result.data?.zoomJoinUrl) {
        window.open(result.data.zoomJoinUrl, '_blank');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error(error?.data?.message || 'Failed to join session');
    }
  };

  const handleLeaveSession = async (sessionId) => {
    try {
      await leaveSession(sessionId).unwrap();
      toast.success('Left session successfully');
      setJoinedSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    } catch (error) {
      console.error('Error leaving session:', error);
      toast.error(error?.data?.message || 'Failed to leave session');
    }
  };

  const getStatusBadge = (session) => {
    const status = session.currentStatus || session.status;
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
      live: 'bg-green-100 text-green-800 border-green-200 animate-pulse',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      ended: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    const icons = {
      upcoming: '⏰',
      live: '🔴',
      completed: '✅',
      cancelled: '❌',
      ended: '🏁'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${badges[status] || badges.upcoming}`}>
        <span className="mr-1">{icons[status] || icons.upcoming}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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

  const CountdownTimer = ({ scheduledDate, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
      const updateCountdown = () => {
        const now = new Date();
        const sessionTime = new Date(scheduledDate);
        const timeDiff = sessionTime.getTime() - now.getTime();

        if (timeDiff <= 0) {
          setTimeLeft('Session Started!');
          if (onTimeUp) onTimeUp();
          return;
        }

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        if (hours > 0) {
          setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    }, [scheduledDate, onTimeUp]);

    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl font-mono text-lg font-bold text-center">
        ⏰ {timeLeft}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🎥 Live Sessions
            </h1>
            <p className="text-gray-600">
              Join live sessions from your enrolled courses
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { key: 'upcoming', label: '⏰ Upcoming Sessions' },
              { key: 'all', label: '📋 All Sessions' }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
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
            <p className="text-gray-600">
              {filter === 'upcoming' 
                ? "No upcoming live sessions scheduled."
                : "No live sessions found in your enrolled courses."
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sessions.map(session => {
              const status = session.currentStatus || session.status;
              const isJoined = joinedSessions.has(session._id);
              
              return (
                <div key={session._id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-200">
                  {/* Live Session Alert */}
                  {status === 'live' && (
                    <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 text-center font-semibold animate-pulse">
                      🔴 LIVE NOW - Join the session!
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              {session.title}
                            </h3>
                            <p className="text-gray-600 mb-3">
                              {session.description}
                            </p>
                            <div className="flex items-center text-sm text-gray-500 mb-2">
                              <span className="mr-2">📚</span>
                              <span className="font-medium">{session.course?.title}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="mr-2">👨‍🏫</span>
                              <span>{session.instructor?.name}</span>
                            </div>
                          </div>
                          {getStatusBadge(session)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
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
                        </div>

                        {/* Countdown Timer for Upcoming Sessions */}
                        {status === 'upcoming' && (
                          <div className="mb-6">
                            <CountdownTimer 
                              scheduledDate={session.scheduledDate}
                              onTimeUp={() => refetch()}
                            />
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 lg:mt-0 lg:ml-6 flex flex-col gap-3 min-w-[200px]">
                        {canJoinSession(session) && !isJoined && (
                          <button
                            onClick={() => handleJoinSession(session._id)}
                            disabled={isJoining}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                          >
                            {isJoining ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Joining...
                              </>
                            ) : (
                              <>
                                <span className="mr-2">🚀</span>
                                Join Session
                              </>
                            )}
                          </button>
                        )}

                        {canJoinSession(session) && isJoined && (
                          <button
                            onClick={() => handleLeaveSession(session._id)}
                            disabled={isLeaving}
                            className="bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                          >
                            {isLeaving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Leaving...
                              </>
                            ) : (
                              <>
                                <span className="mr-2">👋</span>
                                Leave Session
                              </>
                            )}
                          </button>
                        )}

                        {session.zoomJoinUrl && canJoinSession(session) && (
                          <button
                            onClick={() => window.open(session.zoomJoinUrl, '_blank')}
                            className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center justify-center"
                          >
                            <span className="mr-2">🔗</span>
                            Open Zoom
                          </button>
                        )}

                        {session.recordingUrl && (status === 'completed' || status === 'ended') && (
                          <button
                            onClick={() => window.open(session.recordingUrl, '_blank')}
                            className="bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors flex items-center justify-center"
                          >
                            <span className="mr-2">🎬</span>
                            Watch Recording
                          </button>
                        )}

                        {status === 'upcoming' && (
                          <div className="text-center text-sm text-gray-500 mt-2">
                            <div className="flex items-center justify-center">
                              <span className="mr-1">⏳</span>
                              Starts in {getTimeUntilSession(session.scheduledDate)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSessions;
