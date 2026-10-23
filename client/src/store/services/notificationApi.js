import { apiSlice } from "../api/apiSlice";

const notificationApi = apiSlice.injectEndpoints({
  tagTypes: ["Notification", "UnreadCount"],
  endpoints: (builder) => ({
    // Get notifications with pagination and filtering
    getNotifications: builder.query({
      query: ({ page = 1, limit = 20, type, isRead } = {}) => ({
        url: "/notifications",
        params: { page, limit, type, isRead },
      }),
      providesTags: ["Notification"],
    }),

    // Get unread notification count
    getUnreadCount: builder.query({
      query: () => "/notifications/unread-count",
      providesTags: ["UnreadCount"],
    }),

    // Mark notification as read
    markAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PUT",
      }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),

    // Mark all notifications as read
    markAllAsRead: builder.mutation({
      query: () => ({
        url: "/notifications/mark-all-read",
        method: "PUT",
      }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),

    // Delete notification
    deleteNotification: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;

export default notificationApi;
