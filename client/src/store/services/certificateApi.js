import { apiSlice } from "../api/apiSlice";

export const certificateApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get certificates for a specific course (instructor/admin view)
    getCertificatesByCourse: builder.query({
      query: (courseId) => `/certificates/course/${courseId}`,
      providesTags: (result, error, courseId) => [
        { type: 'Certificate', id: `course-${courseId}` }
      ],
    }),

    // Get enrolled students for certificate management
    getEnrolledStudentsForCertificates: builder.query({
      query: (courseId) => `/certificates/course/${courseId}/students`,
      providesTags: (result, error, courseId) => [
        { type: 'Certificate', id: `students-${courseId}` }
      ],
      transformResponse: (response) => response.data || response,
      transformErrorResponse: (response) => response.data || response,
    }),

    // Get student's own certificates
    getStudentCertificates: builder.query({
      query: () => '/certificates/student',
      providesTags: ['Certificate'],
      transformResponse: (response) => response.data || response,
      transformErrorResponse: (response) => response.data || response,
    }),

    // Upload certificate for a student
    uploadCertificate: builder.mutation({
      query: ({ formData }) => ({
        url: '/certificates/upload',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: (result, error, { formData, courseId }) => {
        // Extract courseId from formData if not provided directly
        const actualCourseId = courseId || (formData && formData.get && formData.get('courseId'));
        return [
          { type: 'Certificate', id: `course-${actualCourseId}` },
          { type: 'Certificate', id: `students-${actualCourseId}` },
          'Certificate'
        ];
      },
    }),

    // Download certificate
    downloadCertificate: builder.mutation({
      queryFn: async (certificateId, api) => {
        try {
          const state = api.getState();
          const token = state.auth?.accessToken;
          
          if (!token) {
            return { error: { message: 'No authentication token found' } };
          }
          
          // Create download URL with token as query parameter
          const downloadUrl = `/api/certificates/${certificateId}/download?token=${encodeURIComponent(token)}`;
          
          // Open the download URL in a new tab/window
          window.open(downloadUrl, '_blank');
          
          return { data: { success: true } };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
    }),

    // Delete certificate
    deleteCertificate: builder.mutation({
      query: (certificateId) => ({
        url: `/certificates/${certificateId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Certificate'],
    }),
  }),
});

export const {
  useGetCertificatesByCourseQuery,
  useGetEnrolledStudentsForCertificatesQuery,
  useGetStudentCertificatesQuery,
  useUploadCertificateMutation,
  useDownloadCertificateMutation,
  useDeleteCertificateMutation,
} = certificateApi;
