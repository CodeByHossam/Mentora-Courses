import { apiSlice } from "../api/apiSlice";

export const enrollmentRequestApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all enrollment requests (admin only)
    getEnrollmentRequests: builder.query({
      query: () => ({
        url: "/enrollment-requests",
        method: "GET",
      }),
      transformResponse: (response) => response.data,
      providesTags: ["EnrollmentRequests"],
    }),

    // Get user's enrollment requests
    getUserEnrollmentRequests: builder.query({
      query: () => ({
        url: "/enrollment-requests/user",
        method: "GET",
      }),
      transformResponse: (response) => response.data,
      providesTags: ["EnrollmentRequests"],
    }),

    // Get instructor's enrollment requests
    getInstructorEnrollmentRequests: builder.query({
      query: () => ({
        url: "/enrollment-requests/instructor",
        method: "GET",
      }),
      transformResponse: (response) => response.data,
      providesTags: ["EnrollmentRequests"],
    }),

    // Get user's enrolled courses
    getEnrolledCourses: builder.query({
      query: () => ({
        url: "/courses/user/enrolled",
        method: "GET",
      }),
      transformResponse: (response) => response.data,
      providesTags: ["Courses"],
    }),

    // Create enrollment request
    createEnrollmentRequest: builder.mutation({
      query: (data) => {
        // Handle both FormData (for file uploads) and regular objects
        if (data instanceof FormData) {
          return {
            url: "/enrollment-requests",
            method: "POST",
            body: data,
            formData: true,
          };
        } else {
          return {
            url: "/enrollment-requests",
            method: "POST",
            body: data,
          };
        }
      },
      invalidatesTags: ["EnrollmentRequests"],
    }),

    // Update enrollment request status (admin only)
    updateEnrollmentRequest: builder.mutation({
      query: ({ id, status, adminNote }) => ({
        url: `/enrollment-requests/${id}`,
        method: "PATCH",
        body: { status, adminNote },
      }),
      invalidatesTags: ["EnrollmentRequests", "Courses"],
    }),

    // Delete enrollment request (admin only)
    deleteEnrollmentRequest: builder.mutation({
      query: (id) => ({
        url: `/enrollment-requests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EnrollmentRequests", "Courses"],
    }),

    // Add admin note to enrollment request
    addAdminNote: builder.mutation({
      query: ({ id, note }) => ({
        url: `/enrollment-requests/${id}/notes`,
        method: "POST",
        body: { note },
      }),
      invalidatesTags: ["EnrollmentRequests"],
    }),

    // Edit admin note
    editAdminNote: builder.mutation({
      query: ({ id, noteId, note }) => ({
        url: `/enrollment-requests/${id}/notes/${noteId}`,
        method: "PUT",
        body: { note },
      }),
      invalidatesTags: ["EnrollmentRequests"],
    }),

    // Delete admin note from enrollment request
    deleteAdminNote: builder.mutation({
      query: ({ id, noteId }) => ({
        url: `/enrollment-requests/${id}/notes/${noteId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EnrollmentRequests"],
    }),

    // Get fresh signed URL for bank transfer receipt
    getReceiptUrl: builder.query({
      query: (id) => ({
        url: `/enrollment-requests/${id}/receipt`,
        method: "GET",
      }),
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  useGetEnrollmentRequestsQuery,
  useGetUserEnrollmentRequestsQuery,
  useGetInstructorEnrollmentRequestsQuery,
  useGetEnrolledCoursesQuery,
  useCreateEnrollmentRequestMutation,
  useUpdateEnrollmentRequestMutation,
  useDeleteEnrollmentRequestMutation,
  useAddAdminNoteMutation,
  useEditAdminNoteMutation,
  useDeleteAdminNoteMutation,
  useGetReceiptUrlQuery,
} = enrollmentRequestApi;
