import { apiSlice } from "../api/apiSlice";

export const gradeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Student endpoints
    getAllStudentGrades: builder.query({
      query: () => '/grades/student',
      providesTags: ['StudentGrades'],
    }),
    
    getStudentCourseGrades: builder.query({
      query: (courseId) => `/grades/student/${courseId}`,
      providesTags: (result, error, courseId) => [
        { type: 'StudentGrades', id: courseId }
      ],
    }),

    // Instructor endpoints
    getCourseGrades: builder.query({
      query: (courseId) => `/grades/course/${courseId}`,
      providesTags: (result, error, courseId) => [
        { type: 'CourseGrades', id: courseId }
      ],
    }),

    getCourseTests: builder.query({
      query: (courseId) => `/grades/course/${courseId}/tests`,
      providesTags: (result, error, courseId) => [
        { type: 'CourseTests', id: courseId }
      ],
    }),

    createFinalGrade: builder.mutation({
      query: (gradeData) => ({
        url: '/grades/final',
        method: 'POST',
        body: gradeData,
      }),
      invalidatesTags: ['CourseGrades', 'StudentGrades'],
    }),

    createTestGrade: builder.mutation({
      query: (gradeData) => ({
        url: '/grades/test',
        method: 'POST',
        body: gradeData,
      }),
      invalidatesTags: ['CourseGrades', 'StudentGrades'],
    }),

    deleteGrade: builder.mutation({
      query: (gradeId) => ({
        url: `/grades/${gradeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CourseGrades', 'StudentGrades', 'CourseTests'],
    }),
  }),
});

export const {
  useGetAllStudentGradesQuery,
  useGetStudentCourseGradesQuery,
  useGetCourseGradesQuery,
  useGetCourseTestsQuery,
  useCreateFinalGradeMutation,
  useCreateTestGradeMutation,
  useDeleteGradeMutation,
} = gradeApi;
