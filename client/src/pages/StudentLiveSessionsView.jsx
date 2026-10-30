import React from "react";

const StudentLiveSessionsView = (props) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white shadow rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Video className="h-8 w-8 text-purple-600 mr-3" />
              My Live Sessions
            </h1>
            <p className="text-gray-600 mt-2">
              Join live sessions from your enrolled courses
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/student/courses')}
              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Courses
            </button>
            <button
              onClick={() => refetch()}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Live Now</p>
              <p className="text-3xl font-bold text-gray-900">{stats.live}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Play className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions, courses, instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Sessions</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live Now</option>
              <option value="past">Past Sessions</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="scheduledDate">Sort by Date</option>
              <option value="course">Sort by Course</option>
              <option value="instructor">Sort by Instructor</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center justify-center px-4 py-2 w-full border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-6">
        {filteredAndSortedSessions.length === 0 ? (
          <div className="text-center py-12">
            <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== "all"
                ? "No sessions match your current filters."
                : "You don't have any live sessions from your enrolled courses yet."}
            </p>
            <button
              onClick={() => navigate('/student/courses')}
              className="flex items-center mx-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Browse Courses
            </button>
          </div>
        ) : (
          filteredAndSortedSessions.map((session) => {
            const statusInfo = getSessionStatus(session);
            const dateTime = formatDateTime(session.scheduledDate);
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedSession === session._id;
            const countdown = getCountdown(session.scheduledDate);

            return (
              <div key={session._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 mr-3">
                          {session.title}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                          <StatusIcon className="h-4 w-4 mr-1" />
                          {statusInfo.label}
                        </span>
                        {countdown && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Timer className="h-3 w-3 mr-1" />
                            {countdown}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span className="font-medium">Course:</span>
                        <button
                          onClick={() => navigate(`/course/${session.course?._id}`)}
                          className="ml-1 text-purple-600 hover:text-purple-800 hover:underline"
                        >
                          {session.course?.title}
                        </button>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">Instructor:</span>
                        <span className="ml-1 text-blue-600">{session.instructor?.name}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="font-medium">Date:</span>
                        <span className="ml-1">{dateTime.date}</span>
                        <span className="mx-2">•</span>
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="font-medium">Time:</span>
                        <span className="ml-1">{dateTime.time}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">Duration:</span>
                        <span className="ml-1">{session.duration} minutes</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-6">
                      {/* Join Button - For live and ready sessions */}
                      {(statusInfo.status === "live" || statusInfo.status === "ready") && (
                        <button
                          onClick={() => handleJoinSession(session._id)}
                          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Join Session
                        </button>
                      )}

                      {/* View Recording Button - For completed sessions with recordings */}
                      {(statusInfo.status === "completed" || statusInfo.status === "ended") && session.recordingUrl && (
                        <button
                          onClick={() => window.open(session.recordingUrl, '_blank')}
                          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Recording
                        </button>
                      )}

                      {/* Expand Button */}
                      <button
                        onClick={() => setExpandedSession(isExpanded ? null : session._id)}
                        className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t pt-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Session Details</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Description:</span>
                              <p className="text-gray-800 mt-1">{session.description || "No description provided"}</p>
                            </div>
                            {session.zoomMeetingId && (
                              <div>
                                <span className="font-medium text-gray-600">Meeting ID:</span>
                                <span className="ml-2 font-mono text-gray-800">{session.zoomMeetingId}</span>
                              </div>
                            )}
                            {session.zoomPassword && (
                              <div>
                                <span className="font-medium text-gray-600">Passcode:</span>
                                <span className="ml-2 font-mono text-gray-800">{session.zoomPassword}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Course Information</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Category:</span>
                              <span className="ml-2 text-gray-800">{session.course?.category?.name || "N/A"}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Price:</span>
                              <span className="ml-2 text-gray-800">${session.course?.price || "N/A"}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Enrolled Students:</span>
                              <span className="ml-2 text-gray-800">
                                {session.course?.enrolledStudents?.length || 0} students
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentLiveSessionsView;
