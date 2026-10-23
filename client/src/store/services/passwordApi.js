import { apiSlice } from "../api/apiSlice";

export const mailApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Send password reset email
    sendPasswordLink: builder.mutation({
      query: (data) => ({
        url: "/password/password-link", 
        method: "POST",
        body: data,
      }),
    }),

    // 2. Reset the password using token and userId
    resetPassword: builder.mutation({
      query: ({ userId, token, password }) => ({
        url: `password/reset-password/${userId}/${token}`,
        method: "POST",
        body: { password },
      }),
    }),
  }),
});

export const {
  useSendPasswordLinkMutation,
  useResetPasswordMutation,
} = mailApi;
