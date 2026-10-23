/**
 * Live Session API Service
 * 
 * RTK Query API service for live session management
 */

import { apiSlice } from "../api/apiSlice";

export const liveSessionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new live session
    createLiveSession: builder.mutation({
      query: (sessionData) => ({
        url: "/live-sessions",
        method: "POST",
        body: sessionData,
      }),
      invalidatesTags: ["LiveSession"],
    }),

    // Get sessions by course
    getSessionsByCourse: builder.query({
      query: ({ courseId, status, upcoming, page = 1, limit = 10 }) => ({
        url: `/live-sessions/course/${courseId}`,
        params: { status, upcoming, page, limit },
      }),
      providesTags: (result, error, { courseId }) => [
        { type: "LiveSession", id: `course-${courseId}` },
      ],
    }),

    // Get instructor's sessions
    getInstructorSessions: builder.query({
      query: ({ status, upcoming, page = 1, limit = 10 }) => ({
        url: "/live-sessions/instructor",
        params: { status, upcoming, page, limit },
      }),
      providesTags: ["LiveSession"],
    }),

    // Get student's sessions
    getStudentSessions: builder.query({
      query: ({ upcoming, page = 1, limit = 10 }) => ({
        url: "/live-sessions/student",
        params: { upcoming, page, limit },
      }),
      providesTags: ["LiveSession"],
    }),

    // Get single live session
    getLiveSession: builder.query({
      query: (sessionId) => ({
        url: `/live-sessions/${sessionId}`,
      }),
      providesTags: (result, error, sessionId) => [
        { type: "LiveSession", id: sessionId },
      ],
    }),

    // Update live session
    updateLiveSession: builder.mutation({
      query: ({ sessionId, ...updateData }) => ({
        url: `/live-sessions/${sessionId}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "LiveSession", id: sessionId },
        "LiveSession",
      ],
    }),

    // Delete live session
    deleteLiveSession: builder.mutation({
      query: (sessionId) => ({
        url: `/live-sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LiveSession"],
    }),

    // Join live session
    joinLiveSession: builder.mutation({
      query: (sessionId) => ({
        url: `/live-sessions/${sessionId}/join`,
        method: "POST",
      }),
      invalidatesTags: (result, error, sessionId) => [
        { type: "LiveSession", id: sessionId },
      ],
    }),

    // Leave live session
    leaveLiveSession: builder.mutation({
      query: (sessionId) => ({
        url: `/live-sessions/${sessionId}/leave`,
        method: "POST",
      }),
      invalidatesTags: (result, error, sessionId) => [
        { type: "LiveSession", id: sessionId },
      ],
    }),

    // Start live session
    startLiveSession: builder.mutation({
      query: (sessionId) => ({
        url: `/live-sessions/${sessionId}/start`,
        method: "POST",
      }),
      invalidatesTags: (result, error, sessionId) => [
        { type: "LiveSession", id: sessionId },
        "LiveSession",
      ],
    }),

    // End live session
    endLiveSession: builder.mutation({
      query: (sessionId) => ({
        url: `/live-sessions/${sessionId}/end`,
        method: "POST",
      }),
      invalidatesTags: (result, error, sessionId) => [
        { type: "LiveSession", id: sessionId },
        "LiveSession",
      ],
    }),

    // Upload session recording
    uploadSessionRecording: builder.mutation({
      query: ({ sessionId, recordingData }) => ({
        url: `/live-sessions/${sessionId}/recording`,
        method: "POST",
        body: recordingData,
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "LiveSession", id: sessionId },
      ],
    }),

    // Cancel live session
    cancelLiveSession: builder.mutation({
      query: (sessionId) => ({
        url: `/live-sessions/${sessionId}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (result, error, sessionId) => [
        { type: "LiveSession", id: sessionId },
        "LiveSession",
      ],
    }),

    // Admin: Get all live sessions
    getAllLiveSessions: builder.query({
      query: ({ status, upcoming, page = 1, limit = 50 }) => ({
        url: "/live-sessions/admin/all",
        params: { status, upcoming, page, limit },
      }),
      providesTags: ["LiveSession"],
    }),
  }),
});

export const {
  useCreateLiveSessionMutation,
  useGetSessionsByCourseQuery,
  useGetInstructorSessionsQuery,
  useGetStudentSessionsQuery,
  useGetLiveSessionQuery,
  useUpdateLiveSessionMutation,
  useDeleteLiveSessionMutation,
  useJoinLiveSessionMutation,
  useLeaveLiveSessionMutation,
  useStartLiveSessionMutation,
  useEndLiveSessionMutation,
  useUploadSessionRecordingMutation,
  useCancelLiveSessionMutation,
  useGetAllLiveSessionsQuery,
} = liveSessionApi;
