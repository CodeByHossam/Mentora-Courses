import React from "react";

const StudentNotificationsView = (props) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                🔔 Notifications
              </h1>
              <p className="text-gray-600">
                Stay updated with your learning progress and important announcements
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                <span className="text-sm font-medium text-gray-600">
                  {unreadCount} unread
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">{unreadCount}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Course Updates</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {notifications.filter(n => n.type === 'course_enrollment' || n.type === 'course_update').length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Messages</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {notifications.filter(n => n.type === 'message').length}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Notification Types</h4>
                <div className="space-y-2">
                  {[
                    { key: "course", label: "Course Updates", icon: BookOpen },
                    { key: "session", label: "Live Sessions", icon: Video },
                    { key: "assignment", label: "Assignments & Grades", icon: Award },
                    { key: "payment", label: "Payment Updates", icon: CreditCard },
                    { key: "message", label: "Messages", icon: MessageSquare }
                  ].map(({ key, label, icon: Icon }) => (
                    <label key={key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings[key]}
                        onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Delivery Methods</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.email}
                      onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Email Notifications</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.push}
                      onChange={(e) => setSettings(prev => ({ ...prev, push: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Push Notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All Notifications', count: notifications.length },
                { value: 'unread', label: 'Unread', count: notifications.filter(n => !n.isRead).length },
                { value: 'course_enrollment', label: 'Course Updates', count: notifications.filter(n => n.type === 'course_enrollment').length },
                { value: 'live_session', label: 'Live Sessions', count: notifications.filter(n => n.type === 'live_session').length },
                { value: 'assignment_graded', label: 'Assignments', count: notifications.filter(n => n.type === 'assignment_graded').length },
                { value: 'payment', label: 'Payments', count: notifications.filter(n => n.type === 'payment').length },
                { value: 'message', label: 'Messages', count: notifications.filter(n => n.type === 'message').length }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterType === filter.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="mt-4 flex items-center justify-between">
            {selectedNotifications.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700 font-medium">
                  {selectedNotifications.length} selected
                </span>
                <button
                  onClick={handleMarkSelectedAsRead}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Mark as Read
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            )}

            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {notifications.length === 0 ? "No Notifications" : "No Matching Notifications"}
            </h3>
            <p className="text-gray-600 mb-6">
              {notifications.length === 0
                ? "You're all caught up! New notifications will appear here when you have updates."
                : "No notifications match your current filter. Try selecting a different filter option."
              }
            </p>
            {notifications.length > 0 && (
              <button
                onClick={() => setFilterType("all")}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Show All Notifications
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification._id}
                  className={`bg-white rounded-xl shadow-sm border p-6 transition-all hover:shadow-md ${
                    !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification._id)}
                      onChange={() => handleSelectNotification(notification._id)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />

                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-lg ${getNotificationColor("blue")}`}>
                      {Icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-lg font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                            {!notification.isRead && (
                              <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </h3>
                          <p className="text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-sm text-gray-500 mt-2">{formatTime(notification.createdAt)}</p>

                          {/* Reply Button */}
                          {(notification.type === 'message' || notification.type === 'course_enrollment') && (
                            <button
                              onClick={() => handleReply(notification)}
                              className="mt-3 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200 transition-colors"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Reply
                            </button>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead ? (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsUnread(notification._id)}
                              className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Mark as unread"
                            >
                              <Bell className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply Modal */}
        {replyingTo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reply to: {replyingTo.title}
              </h3>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyMessage('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Reply</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Notification Settings</h3>
              <p className="text-gray-600">Manage your notification preferences</p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Configure</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  );
};

export default StudentNotificationsView;
