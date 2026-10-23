import { apiSlice } from "../api/apiSlice";

export const videoApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Generate temporary video streaming URL
    generateStreamingUrl: builder.mutation({
      query: ({ lessonId, quality = 'auto' }) => ({
        url: `/videos/stream/${lessonId}`,
        method: 'POST',
        body: { quality },
      }),
      transformResponse: (response) => response.data,
      // Add tags for cache invalidation
      invalidatesTags: (result, error, { lessonId }) => [
        { type: 'VideoStream', id: lessonId }
      ],
    }),

    // Verify video access token
    verifyVideoAccess: builder.mutation({
      query: ({ token, lessonId }) => ({
        url: '/videos/verify',
        method: 'POST',
        body: { token, lessonId },
      }),
      transformResponse: (response) => response.data,
    }),

    // Get video metadata without URL
    getVideoMetadata: builder.query({
      query: (lessonId) => `/videos/metadata/${lessonId}`,
      transformResponse: (response) => response.data,
    }),

    // Debug lesson video info (admin/instructor only)
    debugLessonVideo: builder.query({
      query: (lessonId) => `/videos/debug/${lessonId}`,
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  useGenerateStreamingUrlMutation,
  useVerifyVideoAccessMutation,
  useGetVideoMetadataQuery,
  useDebugLessonVideoQuery,
} = videoApi;
