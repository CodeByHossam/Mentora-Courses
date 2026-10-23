import { apiSlice } from "../api/apiSlice";

export const courseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCourses: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value) query.append(key, value);
        });

        return `/courses?${query.toString()}`;
      },
      providesTags: (response) =>
        response?.data && Array.isArray(response.data) && response.data.length > 0
          ? [
              ...response.data.map(({ _id }) => ({ type: "Course", id: _id })),
              { type: "Course", id: "LIST" },
            ]
          : [{ type: "Course", id: "LIST" }],
    }),

    getAllCourses: builder.query({
      query: () => "/courses/all-courses",
      providesTags: (result) =>
        result
          ? [
              ...result.map((course) => ({ type: "Course", id: course._id })),
              { type: "Course", id: "LIST" },
            ]
          : [{ type: "Course", id: "LIST" }],
      transformResponse: (response) => response.data,
    }),

    getCourse: builder.query({
      query: (id) => `/courses/${id}`,
      providesTags: (result, error, id) => [{ type: "Course", id }],
      transformResponse: (response) => response.data,
    }),

    createCourse: builder.mutation({
      query: (course) => ({
        url: "/courses",
        method: "POST",
        body: course,
      }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),

    updateCourse: builder.mutation({
      query: ({ id, ...course }) => ({
        url: `/courses/${id}`,
        method: "PUT",
        body: course,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Course", id }],
    }),

    updateCourseStatus: builder.mutation({
      query: ({ courseId, status }) => ({
        url: `/courses/${courseId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Course", id: courseId },
        { type: "Course", id: "LIST" },
        "Course" // Invalidate all course-related queries
      ],
      // Optimistic update for immediate UI feedback
      async onQueryStarted({ courseId, status }, { dispatch, queryFulfilled, getState }) {
        // Get current user from state to update the correct instructor courses cache
        const state = getState();
        const currentUser = state.auth?.user;
        
        if (currentUser?.id) {
          // Update the instructor courses cache optimistically
          const patchResult = dispatch(
            courseApi.util.updateQueryData('getInstructorCourses', currentUser.id, (draft) => {
              const course = draft?.find(course => course._id === courseId);
              if (course) {
                course.status = status;
              }
            })
          );
          
          try {
            await queryFulfilled;
          } catch {
            patchResult.undo();
          }
        } else {
          // Fallback: just wait for the query to complete and let invalidation handle it
          await queryFulfilled;
        }
      },
    }),

    deleteCourse: builder.mutation({
      query: (id) => ({
        url: `/courses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),

    getCourseStudents: builder.query({
      query: (courseId) => `/courses/${courseId}/students`,
      providesTags: (result, error, courseId) => [
        { type: "Course", id: courseId },
        { type: "CourseStudents", id: courseId }
      ],
      transformResponse: (response) => response.data,
    }),

    // 👨‍🏫 Instructor
    getInstructorCourses: builder.query({
      query: (instructorId) => `/courses/instructor/${instructorId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map((course) => ({ type: "Course", id: course._id })),
              { type: "Course", id: "INSTRUCTOR_LIST" },
              "Course"
            ]
          : [{ type: "Course", id: "INSTRUCTOR_LIST" }, "Course"],
      transformResponse: (response) => response.data,
    }),

    // 👨‍�� Student
    enrollInCourse: builder.mutation({
      query: (courseId) => ({
        url: `courses/${courseId}/enroll`,
        method: "POST",
      }),
      invalidatesTags: ["Course", "Progress"],
    }),

    getEnrolledCourses: builder.query({
      query: () => "courses/user/enrolled",
      providesTags: ["Course", "Progress"],
      transformResponse: (response) => response.data,
    }),

    updateProgress: builder.mutation({
      query: ({ courseId, progress }) => ({
        url: `courses/${courseId}/progress`,
        method: "PUT",
        body: { progress },
      }),
      invalidatesTags: ["Progress"],
    }),

    // 🏷️ Categories
    getCategories: builder.query({
      query: () => "/categories",
      providesTags: ["Category"],
      transformResponse: (response) => response.data,
    }),

    createCategory: builder.mutation({
      query: (category) => ({
        url: "/categories",
        method: "POST",
        body: category,
      }),
      invalidatesTags: ["Category"],
    }),

    updateCategory: builder.mutation({
      query: ({ id, ...category }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: category,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Category", id }],
    }),

    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),

    // --- Rating & Like ---
    // getCourseRatingInfo removed in favor of embedded ratingInfo in course payloads
    rateCourse: builder.mutation({
      query: ({ id, value }) => ({
        url: `/courses/${id}/rate`,
        method: "POST",
        body: { value },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Course", id },
        { type: "Course", id, rating: true },
      ],
    }),
    likeCourse: builder.mutation({
      query: (id) => ({
        url: `/courses/${id}/like`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Course", id },
        { type: "Course", id, rating: true },
      ],
    }),

    // Payment initiation endpoint
    initiatePayment: builder.mutation({
      query: ({ courseId, method }) => ({
        url: '/payments/initiate',
        method: 'POST',
        body: { courseId, method }
      }),
      invalidatesTags: ['Payment']
    }),

    // CSRF token endpoint
    getCsrfToken: builder.query({
      query: () => '/payments/csrf-token',
      providesTags: ['CsrfToken']
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useUpdateCourseStatusMutation,
  useDeleteCourseMutation,
  useGetInstructorCoursesQuery,
  useEnrollInCourseMutation,
  useGetEnrolledCoursesQuery,
  useUpdateProgressMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useRateCourseMutation,
  useLikeCourseMutation,
  useGetAllCoursesQuery,
  useGetCourseStudentsQuery,
  useInitiatePaymentMutation,
  useGetCsrfTokenQuery
} = courseApi;
