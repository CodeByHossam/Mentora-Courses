import { apiSlice } from "../api/apiSlice";

const messageApi = apiSlice.injectEndpoints({
  tagTypes: ["Message", "Conversation", "UnreadCount"],
  endpoints: (builder) => ({
    // Get all conversations
    getConversations: builder.query({
      query: () => "/messages/conversations",
      providesTags: ["Conversation"],
    }),

    // Get student's instructors for starting conversations
    getStudentInstructors: builder.query({
      query: () => "/messages/instructors",
      providesTags: ["Instructors"],
    }),

    // Get conversation with specific user
    getConversation: builder.query({
      query: ({ userId, courseId }) => ({
        url: `/messages/conversation/${userId}`,
        params: courseId ? { courseId } : {},
      }),
      providesTags: (result, error, { userId }) => [
        { type: "Conversation", id: userId },
        "Message",
      ],
    }),

    // Send a new message
    sendMessage: builder.mutation({
      query: (messageData) => ({
        url: "/messages",
        method: "POST",
        body: messageData,
      }),
      invalidatesTags: (result, error, { receiverId }) => [
        "Conversation",
        { type: "Conversation", id: receiverId },
        "Message",
        "UnreadCount",
      ],
    }),

    // Mark message as read
    markAsRead: builder.mutation({
      query: (messageId) => ({
        url: `/messages/${messageId}/read`,
        method: "PUT",
      }),
      invalidatesTags: ["Message", "Conversation", "UnreadCount"],
    }),

    // Delete message
    deleteMessage: builder.mutation({
      query: (messageId) => ({
        url: `/messages/${messageId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Message", "Conversation"],
    }),

    // Get unread message count
    getUnreadCount: builder.query({
      query: () => "/messages/unread-count",
      providesTags: ["UnreadCount"],
    }),

    // Search messages
    searchMessages: builder.query({
      query: ({ q, courseId, messageType }) => ({
        url: "/messages/search",
        params: { q, courseId, messageType },
      }),
      providesTags: ["Message"],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useSendMessageMutation,
  useMarkAsReadMutation,
  useDeleteMessageMutation,
  useGetUnreadCountQuery,
  useSearchMessagesQuery,
  useGetStudentInstructorsQuery,
} = messageApi;

export default messageApi;
