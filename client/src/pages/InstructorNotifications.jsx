import React, { useState } from 'react';
import { Bell, Check, X, Filter, Search, Calendar, User, BookOpen, CreditCard, Settings, MessageSquare, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from '../store/services/notificationApi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const InstructorNotifications = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // API calls for real notification data
  const { data: notificationsData, isLoading, error, refetch } = useGetNotificationsQuery({
    page: 1,
    limit: 100,
    type: selectedFilter === 'all' ? undefined : selectedFilter,
  });
  const { data: unreadCountData } = useGetUnreadCountQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = notificationsData?.data || [];
  const totalUnreadCount = unreadCountData?.data?.unreadCount || 0;

  // Helper function to get notification display properties
  const getNotificationProps = (type) => {
    switch (type) {
      case 'course':
      case 'course_enrollment':
      case 'course_update':
        return { icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'live_session':
        return { icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-50' };
      case 'payment':
        return { icon: CreditCard, color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
      case 'message':
        return { icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-50' };
      case 'assignment_graded':
        return { icon: User, color: 'text-orange-600', bgColor: 'bg-orange-50' };
      case 'system':
      default:
        return { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  // Format timestamp
  const formatTimestamp = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
      if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} days ago`;
      return format(date, 'MMM dd, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Notifications', count: notifications.length },
    { value: 'unread', label: 'Unread', count: notifications.filter(n => !n.isRead).length },
    { value: 'course_enrollment', label: 'Course Enrollments', count: notifications.filter(n => n.type === 'course_enrollment').length },
    { value: 'course_update', label: 'Course Updates', count: notifications.filter(n => n.type === 'course_update').length },
    { value: 'live_session', label: 'Live Sessions', count: notifications.filter(n => n.type === 'live_session').length },
    { value: 'payment', label: 'Payments', count: notifications.filter(n => n.type === 'payment').length },
    { value: 'message', label: 'Messages', count: notifications.filter(n => n.type === 'message').length },
    { value: 'assignment_graded', label: 'Assignments', count: notifications.filter(n => n.type === 'assignment_graded').length }
  ];

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'unread' && !notification.isRead) ||
                         notification.type === selectedFilter;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id).unwrap();
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAsUnread = async (id) => {
    // Note: The API doesn't have mark as unread, but we can implement if needed
    toast.info('Mark as unread feature not implemented yet');
  };

  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(notifId => notifId !== id)
        : [...prev, id]
    );
  };

  const handleReply = (notification) => {
    if (notification.sender && notification.type === 'message') {
      setReplyingTo(notification);
    }
  };

  const handleSendReply = () => {
    if (replyMessage.trim() && replyingTo) {
      // Navigate to messages page with the user
      navigate('/instructor/messages', { 
        state: { 
          startConversation: true, 
          userId: replyingTo.sender?._id,
          message: replyMessage.trim(),
          subject: `Re: ${replyingTo.title}`
        } 
      });
      setReplyMessage('');
      setReplyingTo(null);
    }
  };

  const handleMarkSelectedAsRead = async () => {
    try {
      const promises = selectedNotifications.map(id => markAsRead(id).unwrap());
      await Promise.all(promises);
      toast.success('Selected notifications marked as read');
      setSelectedNotifications([]);
    } catch (error) {
      toast.error('Failed to mark selected notifications as read');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const promises = selectedNotifications.map(id => deleteNotification(id).unwrap());
      await Promise.all(promises);
      toast.success('Selected notifications deleted');
      setSelectedNotifications([]);
    } catch (error) {
      toast.error('Failed to delete selected notifications');
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to delete all notifications? This action cannot be undone.")) {
      try {
        const promises = notifications.map(notification => deleteNotification(notification._id).unwrap());
        await Promise.all(promises);
        toast.success('All notifications deleted');
        setSelectedNotifications([]);
      } catch (error) {
        toast.error('Failed to delete notifications');
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
                Stay updated with your course activities and student interactions
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
                    {notifications.filter(n => n.type === 'course').length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Payments</p>
                  <p className="text-2xl font-bold text-green-600">
                    {notifications.filter(n => n.type === 'payment').length}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedFilter === filter.value
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <X className="h-16 w-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading notifications</h3>
              <p className="text-gray-500 mb-4">Failed to fetch notifications from server</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms' : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const { icon: Icon, color, bgColor } = getNotificationProps(notification.type);
              const canReply = notification.sender && notification.type === 'message';
              
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
                    <div className={`flex-shrink-0 p-2 rounded-lg ${bgColor}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
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
                          <p className="text-sm text-gray-500 mt-2">{formatTimestamp(notification.createdAt)}</p>
                          
                          {/* Reply Button */}
                          {canReply && (
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
            })
          )}
        </div>

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
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Settings className="h-4 w-4" />
              <span>Configure</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorNotifications;
