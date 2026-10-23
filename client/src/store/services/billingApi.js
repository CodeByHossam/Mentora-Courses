 import { apiSlice } from "../api/apiSlice";

export const billingApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
    // Get user billing account
    getBillingAccount: builder.query({
      query: () => ({
        url: `/billing/account?t=${Date.now()}`, // Cache busting with timestamp
        
      }),
      providesTags: ['BillingAccount'],
      transformResponse: (response) => {
        // Simply return the response as-is, let the component handle data extraction
        return response;
      },
      // Force fresh data on every request
      keepUnusedDataFor: 0,
    }),

    // Get billing transactions
    getBillingTransactions: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => 
        `billing/transactions?page=${page}&limit=${limit}`,
      providesTags: ['BillingTransaction'],
      transformResponse: (response) => response.data,
    }),

    // Get gift card balance
    getGiftCardBalance: builder.query({
      query: () => 'billing/gift-card-balance',
      providesTags: ['BillingAccount'],
      transformResponse: (response) => response.data,
    }),

    // Pay with gift card
    payWithGiftCard: builder.mutation({
      query: ({ courseId, amount, giftCardId, giftCardBalance, useCourseGiftCard, remainingBalance }) => ({
        url: 'billing/pay-with-gift-card',
        method: 'POST',
        body: { courseId, amount, giftCardId, giftCardBalance, useCourseGiftCard, remainingBalance },
      }),
      invalidatesTags: ['BillingAccount', 'Course', 'GiftCards'],
      transformResponse: (response) => response, // Return full response with success field
    }),

    // Initiate billing payment (same as course payment structure)
    initiateBillingPayment: builder.mutation({
      query: ({ amount, method }) => ({
        url: '/billing/initiate',
        method: 'POST',
        body: { amount, method },
      }),
      invalidatesTags: ['BillingAccount', 'BillingTransaction'],
      transformResponse: (response) => response.data,
    }),

    // Confirm Stripe billing payment
    confirmStripeBillingPayment: builder.mutation({
      query: ({ paymentIntentId }) => ({
        url: '/billing/stripe/confirm',
        method: 'POST',
        body: { paymentIntentId },
      }),
      invalidatesTags: ['BillingAccount', 'BillingTransaction'],
      transformResponse: (response) => response.data,
    }),

    // Process billing payment (legacy endpoint)
    processBillingPayment: builder.mutation({
      query: (paymentData) => ({
        url: '/billing/pay',
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['BillingAccount', 'BillingTransaction'],
      transformResponse: (response) => response.data,
    }),

    // Submit direct transfer receipt
    submitDirectTransferReceipt: builder.mutation({
      query: ({ paymentId, receiptData }) => ({
        url: `/billing/direct-transfer/${paymentId}`,
        method: 'POST',
        body: receiptData,
      }),
      invalidatesTags: ['BillingAccount', 'BillingTransaction'],
      transformResponse: (response) => response.data,
    }),

    // Get pending direct transfers (Admin only)
    getPendingDirectTransfers: builder.query({
      query: () => '/billing/admin/pending-transfers',
      providesTags: ['PendingTransfers'],
      transformResponse: (response) => response.data,
    }),

    // Approve or reject direct transfer (Admin only)
    approveDirectTransfer: builder.mutation({
      query: ({ paymentId, action, adminNotes }) => ({
        url: `/billing/admin/approve-transfer/${paymentId}`,
        method: 'POST',
        body: { action, adminNotes },
      }),
      invalidatesTags: ['PendingTransfers', 'BillingAccount', 'BillingTransaction'],
      transformResponse: (response) => response.data,
    }),

    // Add billing charge (admin only)
    addBillingCharge: builder.mutation({
      query: (chargeData) => ({
        url: '/billing/admin/charge',
        method: 'POST',
        body: chargeData,
      }),
      invalidatesTags: ['BillingAccount', 'BillingTransaction', 'BillingSummary'],
      transformResponse: (response) => response.data,
    }),

    // Process annual billing (admin only)
    processAnnualBilling: builder.mutation({
      query: () => ({
        url: '/billing/admin/process-annual',
        method: 'POST',
      }),
      invalidatesTags: ['BillingAccount', 'BillingTransaction', 'BillingSummary'],
      transformResponse: (response) => response.data,
    }),

    // Get admin billing summary
    getAdminBillingSummary: builder.query({
      query: () => '/billing/admin/summary',
      providesTags: ['BillingSummary'],
      transformResponse: (response) => response.data,
    }),

    // Create Stripe payment intent
    createPaymentIntent: builder.mutation({
      query: ({ amount, currency = 'usd' }) => ({
        url: '/billing/create-payment-intent',
        method: 'POST',
        body: { amount, currency },
      }),
      transformResponse: (response) => response.data,
    }),

    // Get billing statistics for charts
    getBillingStats: builder.query({
      query: ({ period = '30d' } = {}) => 
        `/stats?period=${period}`,
      providesTags: ['BillingTransaction'],
      transformResponse: (response) => response.data,
    }),

    // Update billing preferences
    updateBillingPreferences: builder.mutation({
      query: (preferences) => ({
        url: '/billing/preferences',
        method: 'PUT',
        body: preferences,
      }),
      invalidatesTags: ['BillingAccount'],
      transformResponse: (response) => response.data,
    }),

    // Get payment methods
    getPaymentMethods: builder.query({
      query: () => '/billing/payment-methods',
      transformResponse: (response) => response.data,
    }),

    // Add payment method
    addPaymentMethod: builder.mutation({
      query: (paymentMethodData) => ({
        url: '/billing/payment-methods',
        method: 'POST',
        body: paymentMethodData,
      }),
      invalidatesTags: ['BillingAccount'],
      transformResponse: (response) => response.data,
    }),

    // Remove payment method
    removePaymentMethod: builder.mutation({
      query: (paymentMethodId) => ({
        url: `/payment-methods/${paymentMethodId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BillingAccount'],
      transformResponse: (response) => response.data,
    }),

    // Get billing notifications
    getBillingNotifications: builder.query({
      query: () => '/billing/notifications',
      transformResponse: (response) => response.data,
    }),

    // Mark billing notification as read
    markNotificationRead: builder.mutation({
      query: (notificationId) => ({
        url: `/billing/notifications/${notificationId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['BillingAccount'],
      transformResponse: (response) => response.data,
    }),

    // Gift Card Operations (Admin only)
    
    // Add gift card to user account
    addGiftCard: builder.mutation({
      query: (giftCardData) => ({
        url: '/billing/admin/gift-card',
        method: 'POST',
        body: giftCardData,
      }),
      invalidatesTags: ['BillingAccount', 'BillingTransaction', 'GiftCards'],
      transformResponse: (response) => response.data,
    }),

    // Get gift card history (Admin view)
    getGiftCardHistory: builder.query({
      query: ({ 
        page = 1, 
        limit = 20, 
        giftCardType, 
        userId, 
        startDate, 
        endDate, 
        minAmount, 
        maxAmount, 
        isActive 
      } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString()
        });
        
        if (giftCardType) params.append('giftCardType', giftCardType);
        if (userId) params.append('userId', userId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (minAmount) params.append('minAmount', minAmount.toString());
        if (maxAmount) params.append('maxAmount', maxAmount.toString());
        if (isActive !== undefined) params.append('isActive', isActive.toString());
        
        return `/billing/admin/gift-cards?${params.toString()}`;
      },
      providesTags: ['GiftCards'],
    }),

    // Get user's gift cards
    getUserGiftCards: builder.query({
      query: ({ page = 1, limit = 10, giftCardType, isActive } = {}) => {
        const params = new URLSearchParams({ page, limit });
        if (giftCardType) params.append('giftCardType', giftCardType);
        if (isActive !== undefined) params.append('isActive', isActive);
        return `/billing/my-gift-cards?${params}`;
      },
      providesTags: ['GiftCards'],
    }),

    // Get course-specific gift card
    getCourseGiftCard: builder.query({
      query: (courseId) => `/billing/course-gift-card/${courseId}`,
      providesTags: (result, error, courseId) => [{ type: 'GiftCards', id: courseId }],
      transformResponse: (response) => response.data,
    }),

    // Delete gift card (Admin only)
    deleteGiftCard: builder.mutation({
      query: (giftCardId) => ({
        url: `/billing/admin/gift-card/${giftCardId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BillingAccount', 'BillingTransaction', 'GiftCards'],
    }),

    // Claim gift card (Instructor)
    claimGiftCard: builder.mutation({
      query: (giftCardId) => ({
        url: `/billing/claim-gift-card/${giftCardId}`,
        method: 'POST',
      }),
      invalidatesTags: ['BillingAccount', 'GiftCards'],
    }),

    // Admin Fee Payment Operations moved to payoutApi.js

    // 🆕 ADMIN DASHBOARD & BILLING - SPECIALIZED ENDPOINTS
    
    // Get admin dashboard data (comprehensive financial overview)
    getAdminDashboard: builder.query({
      query: () => '/billing/admin/dashboard',
      providesTags: ['AdminDashboard', 'BillingAccount'],
      keepUnusedDataFor: 0, // Always fetch fresh data
    }),

    // Get admin billing account (detailed admin financial data)
    getAdminBillingAccount: builder.query({
      query: () => '/billing/admin/account',
      providesTags: ['AdminBillingAccount', 'BillingAccount'],
      keepUnusedDataFor: 0, // Always fetch fresh data
    }),

    // Get all platform transactions (admin view)
    getAllPlatformTransactions: builder.query({
      query: ({ page = 1, limit = 50 } = {}) => 
        `/billing/transactions?page=${page}&limit=${limit}`,
      providesTags: ['BillingTransaction'],
    }),
  }),
});



export const {
  useGetBillingAccountQuery,
  useGetBillingTransactionsQuery,
  useGetGiftCardBalanceQuery,
  usePayWithGiftCardMutation,
  useInitiateBillingPaymentMutation,
  useConfirmStripeBillingPaymentMutation,
  useProcessBillingPaymentMutation,
  useSubmitDirectTransferReceiptMutation,
  useGetPendingDirectTransfersQuery,
  useApproveDirectTransferMutation,
  useAddBillingChargeMutation,
  useProcessAnnualBillingMutation,
  useGetAdminBillingSummaryQuery,
  useCreatePaymentIntentMutation,
  useGetBillingStatsQuery,
  useUpdateBillingPreferencesMutation,
  useGetPaymentMethodsQuery,
  useAddPaymentMethodMutation,
  useRemovePaymentMethodMutation,
  useGetBillingNotificationsQuery,
  useMarkNotificationReadMutation,
  useAddGiftCardMutation,
  useGetGiftCardHistoryQuery,
  useGetUserGiftCardsQuery,
  useGetCourseGiftCardQuery,
  useDeleteGiftCardMutation,
  useClaimGiftCardMutation,
  // 🆕 Admin-specific hooks
  useGetAdminDashboardQuery,
  useGetAdminBillingAccountQuery,
  useGetAllPlatformTransactionsQuery,
} = billingApi;
