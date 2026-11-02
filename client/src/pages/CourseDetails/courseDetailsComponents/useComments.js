import React, { useState } from "react";
import { useAddCommentMutation, useEditCommentMutation, useDeleteCommentMutation } from "../../../store/services/courseInteractionApi";
import { toast } from "react-toastify";

export const useComments = ({ comments = [], currentUser, courseId, lessonId = null }) => {
  const [addComment] = useAddCommentMutation();
  const [editComment] = useEditCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const [commentContent, setCommentContent] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collapsedReplies, setCollapsedReplies] = useState(new Set());

  const filteredComments = lessonId
    ? comments.filter((c) => c.lesson === lessonId)
    : comments.filter((c) => !c.lesson);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setIsSubmitting(true);
    try {
      await addComment({ courseId, content: commentContent, parentCommentId: replyingTo?._id }).unwrap();
      setCommentContent("");
      setReplyingTo(null);
      toast.success(replyingTo ? "Reply added successfully!" : "Comment added successfully!");
    } catch (error) {
      console.error("Failed to submit comment:", error);
      toast.error(error?.data?.message || "Failed to submit comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (comment, replyId = null) => {
    if (!commentContent.trim()) return;
    setIsSubmitting(true);
    try {
      await editComment({ courseId, commentId: comment._id, content: commentContent, replyId }).unwrap();
      setCommentContent("");
      setEditingComment(null);
      toast.success(replyId ? "Reply updated successfully!" : "Comment updated successfully!");
    } catch (error) {
      console.error("Failed to edit comment:", error);
      toast.error(error?.data?.message || "Failed to edit comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (comment, replyId = null) => {
    if (!window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) return;
    try {
      await deleteComment({ courseId, commentId: comment._id, replyId }).unwrap();
      toast.success(replyId ? "Reply deleted successfully!" : "Comment deleted successfully!");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error(error?.data?.message || "Failed to delete comment");
    }
  };

  const startEdit = (comment, reply = null) => {
    setEditingComment({ comment, reply });
    setCommentContent(reply ? reply.content : comment.content);
    setReplyingTo(null);
  };
  const startReply = (comment) => {
    setReplyingTo(comment);
    setEditingComment(null);
    setCommentContent("");
  };
  const cancelEdit = () => {
    setEditingComment(null);
    setReplyingTo(null);
    setCommentContent("");
  };
  const toggleReplies = (commentId) => {
    const newCollapsed = new Set(collapsedReplies);
    if (newCollapsed.has(commentId)) newCollapsed.delete(commentId);
    else newCollapsed.add(commentId);
    setCollapsedReplies(newCollapsed);
  };
  const canEdit = (comment, reply = null) => {
    const targetUser = reply ? reply.user : comment.user;
    return currentUser?.role === "admin" || targetUser?._id === currentUser?.id;
  };
  const canDelete = (comment, reply = null) => {
    const targetUser = reply ? reply.user : comment.user;
    return currentUser?.role === "admin" || targetUser?._id === currentUser?.id;
  };

  return {
    commentContent, setCommentContent,
    editingComment, setEditingComment,
    replyingTo, setReplyingTo,
    isSubmitting,
    collapsedReplies,
    filteredComments,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    startEdit,
    startReply,
    cancelEdit,
    toggleReplies,
    canEdit,
    canDelete,
  };
};
export default useComments;
