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

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // API calls for real notification data
  const { data: notificationsData, isLoading, error, refetch } = useGetNotificationsQuery({
    page: 1,
    limit: 100, // Get more notifications for admin
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
      case 'user':
        return { icon: User, color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'course':
      case 'course_enrollment':
      case 'course_update':
        return { icon: BookOpen, color: 'text-green-600', bgColor: 'bg-green-50' };
      case 'payment':
        return { icon: CreditCard, color: 'text-red-600', bgColor: 'bg-red-50' };
      case 'message':
        return { icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-50' };
      case 'live_session':
        return { icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-50' };
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
    { value: 'user', label: 'User Management', count: notifications.filter(n => n.type === 'user').length },
    { value: 'course_enrollment', label: 'Course Enrollments', count: notifications.filter(n => n.type === 'course_enrollment').length },
    { value: 'course_update', label: 'Course Updates', count: notifications.filter(n => n.type === 'course_update').length },
    { value: 'payment', label: 'Payments', count: notifications.filter(n => n.type === 'payment').length },
    { value: 'message', label: 'Messages', count: notifications.filter(n => n.type === 'message').length },
    { value: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length }
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

  const handleReply = (notification) => {
    if (notification.sender && notification.type === 'message') {
      setReplyingTo(notification);
    }
  };

  const handleSendReply = () => {
    if (replyMessage.trim() && replyingTo) {
      // Navigate to messages page with the user
      navigate('/admin/messages', {
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return null;
};

export default AdminNotifications;
