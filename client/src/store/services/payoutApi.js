/**
 * INSTRUCTOR PAYOUT REQUEST API SERVICE
 * 
 * RTK Query service for instructor payout requests
 */

import { apiSlice } from "../api/apiSlice";

export const payoutApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Instructor endpoints
    createPayoutRequest: builder.mutation({
      query: (requestData) => ({
        url: '/payouts/request',
        method: 'POST',
        body: requestData,
      }),
      invalidatesTags: ['PayoutRequest', 'BillingAccount'],
    }),

    getMyPayoutRequests: builder.query({
      query: () => '/payouts/my-requests',
      providesTags: ['PayoutRequest'],
    }),

    cancelPayoutRequest: builder.mutation({
      query: (requestId) => ({
        url: `/payouts/cancel/${requestId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PayoutRequest'],
    }),

    // Admin endpoints
    getPendingPayoutRequests: builder.query({
      query: () => '/payouts/admin/pending',
      providesTags: ['PayoutRequest'],
    }),

    getPayoutRequestsByStatus: builder.query({
      query: (status) => `/payouts/admin/requests/${status}`,
      providesTags: ['PayoutRequest'],
    }),

    getPayoutStatistics: builder.query({
      query: () => '/payouts/admin/stats',
      providesTags: ['PayoutRequest'],
    }),

    approvePayoutRequest: builder.mutation({
      query: ({ requestId, approvedAmount, adminNotes }) => ({
        url: `/payouts/admin/approve/${requestId}`,
        method: 'POST',
        body: { approvedAmount, adminNotes },
      }),
      invalidatesTags: ['PayoutRequest', 'BillingAccount'],
    }),

    rejectPayoutRequest: builder.mutation({
      query: ({ requestId, adminNotes }) => ({
        url: `/payouts/admin/reject/${requestId}`,
        method: 'POST',
        body: { adminNotes },
      }),
      invalidatesTags: ['PayoutRequest', 'BillingAccount'],
      // Also invalidate billing API cache
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Force refresh billing data
          dispatch({ type: 'api/invalidateTags', payload: ['BillingAccount'] });
        } catch {}
      },
    }),

    processPayoutRequest: builder.mutation({
      query: ({ requestId, transactionReference, adminNotes }) => ({
        url: `/payouts/process/${requestId}`,
        method: 'POST',
        body: { transactionReference, adminNotes },
      }),
      invalidatesTags: ['PayoutRequest', 'BillingAccount'],
    }),

    uploadPayoutReceipt: builder.mutation({
      query: ({ requestId, receiptFile }) => {
        const formData = new FormData();
        formData.append('receipt', receiptFile);
        
        return {
          url: `/payouts/process/${requestId}`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['PayoutRequest', 'BillingAccount'],
    }),

    // Admin direct payout to instructor
    processInstructorPayout: builder.mutation({
      query: (formData) => ({
        url: '/billing/admin/process-instructor-payout',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['PayoutRequest', 'BillingAccount', 'User'],
    }),
  }),
});

export const {
  // Instructor hooks
  useCreatePayoutRequestMutation,
  useGetMyPayoutRequestsQuery,
  useCancelPayoutRequestMutation,
  
  // Admin hooks
  useGetPendingPayoutRequestsQuery,
  useGetPayoutRequestsByStatusQuery,
  useApprovePayoutRequestMutation,
  useRejectPayoutRequestMutation,
  useProcessPayoutRequestMutation,
  useUploadPayoutReceiptMutation,
  useGetPayoutStatisticsQuery,
  useProcessInstructorPayoutMutation,
} = payoutApi;
