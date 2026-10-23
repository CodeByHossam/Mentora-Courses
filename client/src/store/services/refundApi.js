import { apiSlice } from '../api/apiSlice';

export const refundApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Student Refund Operations
    
    // Create student refund request
    createStudentRefund: builder.mutation({
      query: (refundData) => ({
        url: '/refunds/student',
        method: 'POST',
        body: refundData, // Can be FormData or regular object
      }),
      invalidatesTags: ['RefundRequest'],
      transformResponse: (response) => response.data,
    }),

    // Get student's refund requests
    getStudentRefunds: builder.query({
      query: ({ page = 1, limit = 10, status } = {}) => {
        const params = new URLSearchParams({ page, limit });
        if (status) params.append('status', status);
        return `/refunds/student/my-refunds?${params}`;
      },
      providesTags: ['RefundRequest'],
      transformResponse: (response) => response.data,
    }),

    // Instructor Refund Operations
    
    // Create instructor admin fee refund request
    createInstructorRefund: builder.mutation({
      query: (refundData) => ({
        url: '/refunds/instructor/admin-fee-refund',
        method: 'POST',
        body: refundData, // Can be FormData or regular object
      }),
      invalidatesTags: ['RefundRequest', 'BillingAccount'],
      transformResponse: (response) => response.data,
    }),

    // Get instructor's refund requests
    getInstructorRefunds: builder.query({
      query: ({ page = 1, limit = 10, status } = {}) => {
        const params = new URLSearchParams({ page, limit });
        if (status) params.append('status', status);
        return `/refunds/instructor/my-refunds?${params}`;
      },
      providesTags: ['RefundRequest'],
      transformResponse: (response) => response.data,
    }),

    // Admin Refund Operations
    
    // Get pending refund requests (Admin only)
    getPendingRefunds: builder.query({
      query: ({ page = 1, limit = 20, refundType, requesterType } = {}) => {
        const params = new URLSearchParams({ page, limit });
        if (refundType) params.append('refundType', refundType);
        if (requesterType) params.append('requesterType', requesterType);
        return `/refunds/admin/pending?${params}`;
      },
      providesTags: ['RefundRequest'],
      transformResponse: (response) => response.data,
    }),

    // Get all refund requests (Admin only)
    getAllRefunds: builder.query({
      query: ({ 
        page = 1, 
        limit = 20, 
        status, 
        refundType, 
        requesterType,
        startDate,
        endDate 
      } = {}) => {
        const params = new URLSearchParams({ page, limit });
        if (status) params.append('status', status);
        if (refundType) params.append('refundType', refundType);
        if (requesterType) params.append('requesterType', requesterType);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `/refunds/admin/all?${params}`;
      },
      providesTags: ['RefundRequest'],
      transformResponse: (response) => response.data,
    }),

    // Approve refund request (Admin only)
    approveRefund: builder.mutation({
      query: ({ refundId, adminNotes }) => ({
        url: `/refunds/admin/${refundId}/approve`,
        method: 'PATCH',
        body: { adminNotes },
      }),
      invalidatesTags: ['RefundRequest', 'GiftCard'],
      transformResponse: (response) => response.data,
    }),

    // Reject refund request (Admin only)
    rejectRefund: builder.mutation({
      query: ({ refundId, adminNotes }) => ({
        url: `/refunds/admin/${refundId}/reject`,
        method: 'PATCH',
        body: { adminNotes },
      }),
      invalidatesTags: ['RefundRequest'],
      transformResponse: (response) => response.data,
    }),

    // Get refund statistics (Admin only)
    getRefundStats: builder.query({
      query: ({ period = '30d' } = {}) => 
        `/refunds/admin/stats?period=${period}`,
      providesTags: ['RefundRequest'],
      transformResponse: (response) => response.data,
    }),

    // Get refund details by ID
    getRefundDetails: builder.query({
      query: (refundId) => `/refunds/${refundId}`,
      providesTags: (result, error, refundId) => [
        { type: 'RefundRequest', id: refundId }
      ],
      transformResponse: (response) => response.data,
    }),

    // Cancel refund request (User can cancel their own pending requests)
    cancelRefund: builder.mutation({
      query: (refundId) => ({
        url: `/refunds/${refundId}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: ['RefundRequest'],
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  // Student hooks
  useCreateStudentRefundMutation,
  useGetStudentRefundsQuery,
  
  // Instructor hooks
  useCreateInstructorRefundMutation,
  useGetInstructorRefundsQuery,
  
  // Admin hooks
  useGetPendingRefundsQuery,
  useGetAllRefundsQuery,
  useApproveRefundMutation,
  useRejectRefundMutation,
  useGetRefundStatsQuery,
  
  // General hooks
  useGetRefundDetailsQuery,
  useCancelRefundMutation,
} = refundApi;
