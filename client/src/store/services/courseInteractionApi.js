import { apiSlice } from "../api/apiSlice";

export const courseInteractionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get course interactions
    getCourseInteractions: builder.query({
      query: (courseId) => ({
        url: `/course-interactions/${courseId}`,
        method: "GET",
      }),
      providesTags: (result, error, courseId) => [
        { type: "CourseInteraction", id: courseId },
        { type: "CourseInteraction", id: "LIST" },
      ],
      transformResponse: (response) => response.data,
    }),

    // Comment endpoints
    addComment: builder.mutation({
      query: ({ courseId, content, lessonId, parentCommentId }) => ({
        url: `/course-interactions/${courseId}/comments`,
        method: "POST",
        body: { content, lessonId, parentCommentId },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),

    editComment: builder.mutation({
      query: ({ courseId, commentId, content, replyId }) => ({
        url: `/course-interactions/${courseId}/comments/${commentId}`,
        method: "PUT",
        body: { content, replyId },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),

    deleteComment: builder.mutation({
      query: ({ courseId, commentId, replyId }) => ({
        url: `/course-interactions/${courseId}/comments/${commentId}${replyId ? `?replyId=${replyId}` : ''}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),

    // Test endpoints
    addTest: builder.mutation({
      query: ({ courseId, formData }) => {
        return {
          url: `/course-interactions/${courseId}/tests`,
          method: "POST",
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),

    editTest: builder.mutation({
      query: ({ courseId, testId, formData }) => {
        return {
          url: `/course-interactions/${courseId}/tests/${testId}`,
          method: "PUT",
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),

    deleteTest: builder.mutation({
      query: ({ courseId, testId }) => ({
        url: `/course-interactions/${courseId}/tests/${testId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),

    submitTestAnswer: builder.mutation({
      query: ({ courseId, testId, answerFile }) => {
        const body = new FormData();
        body.append("answerFile", answerFile);

        return {
          url: `/course-interactions/${courseId}/tests/${testId}/submit`,
          method: "POST",
          body,
          formData: true,
        };
      },
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),

    uploadAnswerKey: builder.mutation({
      query: ({ courseId, testId, answerKeyFile }) => {
        const body = new FormData();
        body.append("answerKeyFile", answerKeyFile);

        return {
          url: `/course-interactions/${courseId}/tests/${testId}/answer-key`,
          method: "POST",
          body,
          formData: true,
        };
      },
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),

    downloadAnswerKey: builder.query({
      query: ({ courseId, testId }) => ({
        url: `/course-interactions/${courseId}/tests/${testId}/answer-key/download`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),

    deleteTestAnswer: builder.mutation({
      query: ({ courseId, testId, submissionId }) => ({
        url: `/course-interactions/${courseId}/tests/${testId}/submissions/${submissionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),

    gradeTestSubmission: builder.mutation({
      query: ({ courseId, testId, submissionId, grade, feedback }) => ({
        url: `/course-interactions/${courseId}/tests/${testId}/submissions/${submissionId}/grade`,
        method: "PUT",
        body: { grade, feedback },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),

    // Attachment endpoints
    addAttachment: builder.mutation({
      query: ({ courseId, file, title, description, lessonId }) => {
        const body = new FormData();
        body.append("file", file);
        body.append("title", title);
        if (description) body.append("description", description);
        if (lessonId) body.append("lessonId", lessonId);

        return {
          url: `/course-interactions/${courseId}/attachments`,
          method: "POST",
          body,
          formData: true,
        };
      },
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),

    editAttachment: builder.mutation({
      query: ({ courseId, attachmentId, file, title, description, lessonId }) => {
        const body = new FormData();
        if (file) body.append("file", file);
        if (title) body.append("title", title);
        if (description) body.append("description", description);
        if (lessonId) body.append("lessonId", lessonId);

        return {
          url: `/course-interactions/${courseId}/attachments/${attachmentId}`,
          method: "PUT",
          body,
          formData: true,
        };
      },
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),

    removeAttachment: builder.mutation({
      query: ({ courseId, attachmentId }) => ({
        url: `/course-interactions/${courseId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseInteraction", id: courseId },
      ],
    }),
  }),
});

export const {
  useGetCourseInteractionsQuery,
  useAddCommentMutation,
  useEditCommentMutation,
  useDeleteCommentMutation,
  useAddTestMutation,
  useEditTestMutation,
  useDeleteTestMutation,
  useSubmitTestAnswerMutation,
  useUploadAnswerKeyMutation,
  useGradeTestSubmissionMutation,
  useAddAttachmentMutation,
  useEditAttachmentMutation,
  useRemoveAttachmentMutation,
  useDeleteTestAnswerMutation,
} = courseInteractionApi;
