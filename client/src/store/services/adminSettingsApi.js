import { apiSlice } from "../api/apiSlice";

export const adminSettingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get admin settings
    getAdminSettings: builder.query({
      query: () => "/admin/settings",
      providesTags: ["AdminSettings"],
    }),

    // Update admin settings
    updateAdminSettings: builder.mutation({
      query: (settings) => ({
        url: "/admin/settings",
        method: "PUT",
        body: settings,
      }),
      invalidatesTags: ["AdminSettings"],
    }),

    // Update payment settings specifically
    updatePaymentSettings: builder.mutation({
      query: (paymentSettings) => ({
        url: "/admin/settings/payment",
        method: "PUT",
        body: paymentSettings,
      }),
      invalidatesTags: ["AdminSettings", "PaymentBreakdown"],
    }),

    // Reset payment settings to defaults
    resetPaymentSettings: builder.mutation({
      query: () => ({
        url: "/admin/settings/payment/reset",
        method: "POST",
      }),
      invalidatesTags: ["AdminSettings", "PaymentBreakdown"],
    }),

    // Get payment statistics
    getPaymentStats: builder.query({
      query: () => "/admin/settings/payment-stats",
      providesTags: ["PaymentStats"],
    }),

    // Test payment gateway
    testPaymentGateway: builder.mutation({
      query: ({ gateway, credentials }) => ({
        url: "/admin/settings/test-gateway",
        method: "POST",
        body: { gateway, credentials },
      }),
    }),
  }),
});

export const {
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useUpdatePaymentSettingsMutation,
  useResetPaymentSettingsMutation,
  useGetPaymentStatsQuery,
  useTestPaymentGatewayMutation,
} = adminSettingsApi;
