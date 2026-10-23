import { apiSlice } from "../api/apiSlice";

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => "/admin/users",
      transformResponse: (response) => response.data,
      providesTags: ["User"],
    }),
    getUser: builder.query({
      query: (id) => `users/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
      transformResponse: (response) => response.data,
    }),
    createUser: builder.mutation({
      query: (formData) => ({
        url: "users",
        method: "POST",
        body: formData, // make sure to pass FormData here if uploading files
      }),
      invalidatesTags: ["User"],
    }),
    updateUser: builder.mutation({
      query: ({ id, body }) => ({
        url: `users/${id}`,
        method: "PUT",
        body, // should be FormData if handling files
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        "User",
      ],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: "users/profile",
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ["User"],
    }),
    getProfile: builder.query({
      query: () => "users/profile",
      providesTags: ["User"],
    }),
    updateUserActiveState: builder.mutation({
      query: ({ userId, isActive }) => ({
        url: `/admin/users/${userId}/active-state`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["User"],
    }),
    updateUserVerificationState: builder.mutation({
      query: ({ userId, isVerified }) => ({
        url: `/admin/users/${userId}/verification-state`,
        method: "PATCH",
        body: { isVerified },
      }),
      invalidatesTags: ["User"],
    }),
    // Endpoint to get students for an instructor
    getInstructorStudents: builder.query({
      query: (instructorId) => `/users/instructor/${instructorId}/students`,
      transformResponse: (response) => response.data,
      providesTags: ["User"],
    }),
    // Endpoint to get site stats for admin
    getUserStats: builder.query({
      query: () => "/users/stats",
      transformResponse: (response) => response.data,
    }),
    // Admin reports endpoint
    getAdminReports: builder.query({
      query: () => "/admin/reports", // removed hardcoded localhost
      transformResponse: (response) => response.data,
    }),
    // Endpoint to get reports for instructor
    getInstructorReports: builder.query({
      query: (instructorId) => `/users/instructor/${instructorId}/reports`,
      transformResponse: (response) => response.data,
    }),
    // Endpoint to get all instructors with billing data (Admin only)
    getAllInstructors: builder.query({
      query: () => "/admin/instructors-with-billing",
      transformResponse: (response) => response.data,
      providesTags: ["User", "BillingAccount"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateProfileMutation,
  useGetProfileQuery,
  useUpdateUserActiveStateMutation,
  useUpdateUserVerificationStateMutation,
  useGetInstructorStudentsQuery,
  useCreateUserMutation,
  useGetUserStatsQuery,
  useGetAdminReportsQuery,
  useGetInstructorReportsQuery,
  useGetAllInstructorsQuery,
} = userApi;
