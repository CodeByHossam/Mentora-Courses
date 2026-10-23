import { apiSlice } from "../api/apiSlice";

export const adminBulkDeleteApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get deletion statistics
    getDeletionStatistics: builder.query({
      query: () => ({
        url: "/admin/bulk-delete/statistics",
        method: "GET",
      }),
      transformResponse: (response) => response.data,
      providesTags: ['BulkDelete'],
    }),

    // Bulk delete operations
    bulkDeleteComments: builder.mutation({
      query: (data) => ({
        url: "/admin/bulk-delete/comments",
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['BulkDelete', 'Comments'],
    }),

    bulkDeleteTests: builder.mutation({
      query: (data) => ({
        url: "/admin/bulk-delete/tests",
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['BulkDelete', 'Tests', 'Grades'],
    }),

    bulkDeleteNotifications: builder.mutation({
      query: (data) => ({
        url: "/admin/bulk-delete/notifications",
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['BulkDelete', 'Notifications'],
    }),

    bulkDeleteMessages: builder.mutation({
      query: (data) => ({
        url: "/admin/bulk-delete/messages",
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['BulkDelete', 'Messages'],
    }),

    bulkDeleteLiveSessions: builder.mutation({
      query: (data) => ({
        url: "/admin/bulk-delete/live-sessions",
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['BulkDelete', 'LiveSessions'],
    }),

    bulkDeleteCertificates: builder.mutation({
      query: (data) => ({
        url: "/admin/bulk-delete/certificates",
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['BulkDelete', 'Certificates'],
    }),

    bulkDeleteEnrollmentRequests: builder.mutation({
      query: (data) => ({
        url: "/admin/bulk-delete/enrollment-requests",
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['BulkDelete', 'EnrollmentRequests'],
    }),

    // Sensitive deletions
    bulkDeletePayments: builder.mutation({
      query: (data) => ({
        url: "/admin/bulk-delete/payments",
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['BulkDelete', 'Payments'],
    }),

    bulkDeleteBillingTransactions: builder.mutation({
      query: (data) => ({
        url: "/admin/bulk-delete/billing-transactions",
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['BulkDelete', 'BillingTransactions'],
    }),

    bulkDeleteGiftCards: builder.mutation({
      query: (data) => ({
        url: "/admin/bulk-delete/gift-cards",
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['BulkDelete', 'GiftCards'],
    }),

    bulkDeleteAdminFeePayments: builder.mutation({
      query: (data) => ({
        url: "/admin/bulk-delete/admin-fee-payments",
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['BulkDelete', 'AdminFeePayments'],
    }),

    // Nuclear option
    bulkDeleteAllNonCritical: builder.mutation({
      query: (data) => ({
        url: "/admin/bulk-delete/nuclear",
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['BulkDelete'],
    }),
  }),
});

export const {
  useGetDeletionStatisticsQuery,
  useBulkDeleteCommentsMutation,
  useBulkDeleteTestsMutation,
  useBulkDeleteNotificationsMutation,
  useBulkDeleteMessagesMutation,
  useBulkDeleteLiveSessionsMutation,
  useBulkDeleteCertificatesMutation,
  useBulkDeleteEnrollmentRequestsMutation,
  useBulkDeletePaymentsMutation,
  useBulkDeleteBillingTransactionsMutation,
  useBulkDeleteGiftCardsMutation,
  useBulkDeleteAdminFeePaymentsMutation,
  useBulkDeleteAllNonCriticalMutation,
} = adminBulkDeleteApi;
