import { apiSlice } from "../api/apiSlice";

export const lessonApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all lessons (optionally by courseId)
    getLessons: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value) query.append(key, value);
        });
        return `/lessons?${query.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Lesson", id })),
              { type: "Lesson", id: "LIST" },
            ]
          : [{ type: "Lesson", id: "LIST" }],
      transformResponse: (response) => response.data,
    }),

    // Get a single lesson by id
    getLesson: builder.query({
      query: (id) => `/lessons/${id}`,
      providesTags: (result, error, id) => [{ type: "Lesson", id }],
      transformResponse: (response) => response.data,
    }),

    // Add a new lesson to a course (use FormData for file uploads)
    createLesson: builder.mutation({
      query: ({ courseId, formData }) => ({
        url: `/lessons/${courseId}`, 
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [
        { type: "Lesson", id: "LIST" },
        { type: "Course", id: "LIST" },
      ],
    }),

    // Update a lesson by id (could be with or without files)
    updateLesson: builder.mutation({
      query: ({ id, body }) => {
        // If body is FormData, don't set Content-Type (let browser set it)
        return {
        url: `/lessons/${id}`,
        method: "PUT",
          body,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Lesson", id },
        { type: "Lesson", id: "LIST" },
      ],
    }),

    // Delete a lesson by id
    deleteLesson: builder.mutation({
      query: (id) => ({
        url: `/lessons/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Lesson", id: "LIST" }],
    }),
  }),
});

export const {
  useGetLessonsQuery,
  useGetLessonQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
} = lessonApi;
