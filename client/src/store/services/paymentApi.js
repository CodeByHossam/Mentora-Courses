import { apiSlice } from "../api/apiSlice";

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get payment details for a specific instructor
    getPaymentDetails: builder.query({
      query: (instructorId) => `/users/${instructorId}/payment-details`,
      providesTags: (result, error, instructorId) => [
        { type: "PaymentDetails", id: instructorId },
      ],
    }),

    // Update payment details for instructor
    updatePaymentDetails: builder.mutation({
      query: ({ instructorId, paymentDetails }) => ({
        url: `/users/${instructorId}/payment-details`,
        method: "PUT",
        body: paymentDetails,
      }),
      invalidatesTags: (result, error, { instructorId }) => [
        { type: "PaymentDetails", id: instructorId },
      ],
    }),

    // Initiate payment
    initiatePayment: builder.mutation({
      query: ({ courseId, method }) => ({
        url: "/payments/initiate",
        method: "POST",
        body: { courseId, method },
      }),
      invalidatesTags: ["Payment"],
    }),

    // Submit direct transfer payment 
    submitDirectTransfer: builder.mutation({
      query: ({ paymentId, formData }) => ({
        url: `/payments/direct-transfer/${paymentId}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Payment"],
    }),

    // Get user's payment history
    getPaymentHistory: builder.query({
      query: () => `/payments/my-payments`,
      providesTags: ["PaymentHistory"],
    }),

    // Get payment by ID
    getPayment: builder.query({
      query: (paymentId) => `/payments/${paymentId}`,
      providesTags: (result, error, paymentId) => [
        { type: "Payment", id: paymentId },
      ],
    }),

    // Get payment receipt
    getPaymentReceipt: builder.query({
      query: (paymentId) => `/payments/${paymentId}/receipt`,
      providesTags: (result, error, paymentId) => [
        { type: "PaymentReceipt", id: paymentId },
      ],
    }),

    // Get CSRF token
    getCsrfToken: builder.query({
      query: () => "/payments/csrf-token",
      providesTags: ["CsrfToken"],
    }),

    // Get instructor bank details for payment (legacy - not used in simplified system)
    getInstructorBankDetails: builder.query({
      query: (instructorId) => `/users/${instructorId}`,
      providesTags: (result, error, instructorId) => [
        { type: "User", id: instructorId },
      ],
    }),

    // 📦 SIMPLIFIED: Get admin bank details for direct transfers
    // Students transfer money to admin, admin pays instructor directly
    getAdminBankDetails: builder.query({
      query: () => `/users/admin/bank-details`,
      providesTags: ["AdminBankDetails"],
    }),

    // Create payment (for admin manual processing)
    createPayment: builder.mutation({
      query: (paymentData) => ({
        url: "/payments",
        method: "POST",
        body: paymentData,
      }),
      invalidatesTags: ["Payment"],
    }),

    // Get payment statistics for admin dashboard
    getPaymentStats: builder.query({
      query: () => "/payments/stats",
      providesTags: ["Payment"],
    }),

    getPaymentReports: builder.query({
      query: () => "/payments/reports",
      providesTags: ["Payment"],
    }),

    // Get payment breakdown for a course
    getPaymentBreakdown: builder.query({
      query: (courseId) => `/payments/breakdown/${courseId}`,
      providesTags: (result, error, courseId) => [
        { type: "PaymentBreakdown", id: courseId },
      ],
    }),

    // ---- Instructor specific payments ----
    getInstructorPendingTransfers: builder.query({
      query: () => `/payments/instructor/pending-transfers`,
      providesTags: ["InstructorPayments"],
    }),

    approveInstructorTransfer: builder.mutation({
      query: ({ paymentId, note }) => ({
        url: `/payments/${paymentId}/instructor-approve`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ["InstructorPayments", "Payment"],
    }),

    // ---- Admin payment management ----
    getAdminPaymentStats: builder.query({
      query: () => `/admin/settings/payment-stats`,
      providesTags: ["AdminPayments"],
    }),

    getAdminPendingTransfers: builder.query({
      query: () => `/payments/admin/pending-transfers`,
      providesTags: ["AdminPendingTransfers"],
    }),

    approveAdminTransfer: builder.mutation({
      query: ({ paymentId, approved, adminNote }) => ({
        url: `/payments/${paymentId}/approve`,
        method: 'POST',
        body: { approved, adminNote },
      }),
      invalidatesTags: ["AdminPendingTransfers", "AdminPayments"],
    }),
  }),
});

export const {
  useGetPaymentDetailsQuery,
  useUpdatePaymentDetailsMutation,
  useInitiatePaymentMutation,
  useSubmitDirectTransferMutation,
  useGetPaymentHistoryQuery,
  useGetPaymentQuery,
  useGetPaymentReceiptQuery,
  useGetCsrfTokenQuery,
  useGetInstructorBankDetailsQuery,
  useGetAdminBankDetailsQuery, // 📦 SIMPLIFIED: Admin bank details for direct transfers
  useCreatePaymentMutation,
  useGetPaymentStatsQuery,
  useGetPaymentReportsQuery,
  useGetPaymentBreakdownQuery,
  useApproveInstructorTransferMutation,
  useGetInstructorPendingTransfersQuery,
  // Admin payment hooks
  useGetAdminPaymentStatsQuery,
  useGetAdminPendingTransfersQuery,
  useApproveAdminTransferMutation,
} = paymentApi;
