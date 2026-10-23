import { apiSlice } from "../api/apiSlice";

export const instructorRequestApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all instructor requests (admin only)
    getInstructorRequests: builder.query({
      query: () => ({
        url: "/instructor-requests",
        method: "GET",
      }),
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({
                type: "InstructorRequest",
                id: r._id,
              })),
              { type: "InstructorRequest", id: "LIST" },
            ]
          : [{ type: "InstructorRequest", id: "LIST" }],
    }),

    // Get logged-in user's instructor request
    getUserInstructorRequest: builder.query({
      query: () => ({
        url: "/instructor-requests/user",
        method: "GET",
      }),
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result
          ? [{ type: "InstructorRequest", id: result._id }]
          : [],
    }),

    // Create a new instructor request
    createInstructorRequest: builder.mutation({
      query: (data) => ({
        url: "/instructor-requests",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "InstructorRequest", id: "LIST" }],
    }),

    // Update instructor request status (admin only)
    updateInstructorRequest: builder.mutation({
      query: ({ id, status, adminNote }) => ({
        url: `/instructor-requests/${id}`,
        method: "PATCH",
        body: { status, adminNote },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InstructorRequest", id },
      ],
    }),

    // Add notes by admin without changing the status
    addInstructorNote: builder.mutation({
      query: ({ id, adminNote }) => ({
        url: `/instructor-requests/${id}/note`,
        method: "POST",
        body: { adminNote },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InstructorRequest", id },
      ],
    }),

    // Edit admin note
    editInstructorNote: builder.mutation({
      query: ({ id, noteId, note }) => ({
        url: `/instructor-requests/${id}/notes/${noteId}`,
        method: "PUT",
        body: { note },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InstructorRequest", id },
      ],
    }),

    // Delete admin note
    deleteInstructorNote: builder.mutation({
      query: ({ id, noteId }) => ({
        url: `/instructor-requests/${id}/notes/${noteId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InstructorRequest", id },
      ],
    }),

    // Delete instructor request (admin only, optional)
    deleteInstructorRequest: builder.mutation({
      query: (id) => ({
        url: `/instructor-requests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "InstructorRequest", id },
        { type: "InstructorRequest", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetInstructorRequestsQuery,
  useGetUserInstructorRequestQuery,
  useCreateInstructorRequestMutation,
  useUpdateInstructorRequestMutation,
  useDeleteInstructorRequestMutation,
  useAddInstructorNoteMutation,
  useEditInstructorNoteMutation,
  useDeleteInstructorNoteMutation,
} = instructorRequestApi;
