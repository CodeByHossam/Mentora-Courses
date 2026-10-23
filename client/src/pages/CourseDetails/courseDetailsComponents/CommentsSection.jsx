import React, { useState } from "react";
import { Edit, Trash2, Reply, X, MessageCircle, Send, User, Calendar, Heart, ThumbsUp, MoreVertical, ChevronDown, ChevronUp } from "lucide-react";
import { useAddCommentMutation, useEditCommentMutation, useDeleteCommentMutation } from "../../../store/services/courseInteractionApi";
import { toast } from "react-toastify";

const CommentsSection = ({ comments = [], currentUser, courseId, lessonId = null }) => {
  const [addComment] = useAddCommentMutation();
  const [editComment] = useEditCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  
  const [commentContent, setCommentContent] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collapsedReplies, setCollapsedReplies] = useState(new Set());

  // Filter comments based on lessonId
  const filteredComments = lessonId
    ? comments.filter((c) => c.lesson === lessonId)
    : comments.filter((c) => !c.lesson);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment({
        courseId,
        content: commentContent,
        parentCommentId: replyingTo?._id,
      }).unwrap();
      
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
      await editComment({
        courseId,
        commentId: comment._id,
        content: commentContent,
        replyId,
      }).unwrap();
      
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
    if (!window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteComment({
        courseId,
        commentId: comment._id,
        replyId,
      }).unwrap();
      
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
    if (newCollapsed.has(commentId)) {
      newCollapsed.delete(commentId);
    } else {
      newCollapsed.add(commentId);
    }
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

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-100 rounded-lg">
          <MessageCircle className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Discussion</h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {filteredComments?.length || 0} comments
        </span>
      </div>

      {/* Enhanced Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-10">
        {replyingTo && (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">Replying to {replyingTo.user?.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 hover:bg-blue-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        )}
        
        <div className="relative">
          <textarea
            disabled={isSubmitting}
            rows={4}
            placeholder={replyingTo ? "Share your thoughts on this reply..." : "Join the discussion..."}
            className="w-full border-2 border-gray-200 rounded-2xl p-4 pr-16 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 resize-none text-lg bg-white/80 backdrop-blur-sm"
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
          />
          <div className="absolute bottom-4 right-4 text-sm text-gray-400">
            {commentContent.length}/1000
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>Posting as {currentUser?.name || 'Anonymous'}</span>
          </div>
          <div className="flex gap-3">
            {(editingComment || replyingTo) && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={cancelEdit}
                className="px-6 py-3 rounded-2xl bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-lg transition-all duration-300 font-semibold"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !commentContent.trim()}
              className={`group px-8 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none ${
                commentContent.trim()
                  ? "bg-gradient-to-r from-blue-600 to-green-600 text-white hover:from-blue-700 hover:to-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span>
                      {editingComment
                        ? (editingComment.reply ? "Update Reply" : "Update Comment")
                        : replyingTo
                        ? "Post Reply"
                        : "Post Comment"}
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </form>

      {/* Enhanced Comments List */}
      <div className="space-y-6">
        {filteredComments?.length > 0 ? (
          filteredComments.map((comment) => (
            <div key={comment._id} className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    {comment?.user?.avatar ? (
                      <img
                        src={comment.user.avatar}
                        alt={comment?.user?.name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`${comment?.user?.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900">
                        {comment?.user?.name || "Anonymous User"}
                      </p>
                      {comment?.user?.role === 'instructor' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Instructor
                        </span>
                      )}
                      {comment?.user?.role === 'admin' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(comment.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {comment.edited && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          edited
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <ThumbsUp className="w-4 h-4 text-gray-500" />
                    </button>
                    <span className="text-sm text-gray-500">0</span>
                  </div>
                  <div className="relative group">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      {canEdit(comment) && (
                        <button
                          onClick={() => startEdit(comment)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      {canDelete(comment) && (
                        <button
                          onClick={() => handleDeleteComment(comment)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                      <button
                        onClick={() => startReply(comment)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center gap-2"
                      >
                        <Reply className="w-4 h-4" />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {editingComment?.comment._id === comment._id && !editingComment.reply ? (
                <div className="mb-4">
                  <textarea
                    rows={4}
                    className="w-full border-2 border-blue-200 rounded-2xl p-4 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 resize-none"
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={cancelEdit}
                      className="px-6 py-2 text-sm bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditComment(comment)}
                      disabled={isSubmitting}
                      className="px-6 py-2 text-sm bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl hover:from-blue-700 hover:to-green-700 hover:shadow-lg transition-all duration-200 font-medium"
                    >
                      {isSubmitting ? 'Updating...' : 'Update Comment'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
                    {comment?.content || "[No content available]"}
                  </p>
                </div>
              )}

              {/* Enhanced Replies */}
              {comment.responses?.length > 0 && (
                <div className="ml-8 mt-6 space-y-4 border-l-4 border-gradient-to-b from-blue-200 to-green-200 pl-6">
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => toggleReplies(comment._id)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors p-2 -ml-2 rounded-lg hover:bg-blue-50"
                    >
                      {collapsedReplies.has(comment._id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                      <Reply className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {collapsedReplies.has(comment._id) ? 'Show' : 'Hide'} {comment.responses.length} {comment.responses.length === 1 ? 'reply' : 'replies'}
                      </span>
                    </button>
                  </div>
                  {!collapsedReplies.has(comment._id) && comment.responses.map((reply) => (
                    <div key={reply._id} className="bg-gradient-to-r from-blue-50 to-white rounded-2xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full border-2 border-white shadow-md bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            {reply?.user?.avatar ? (
                              <img
                                src={reply.user.avatar}
                                alt={reply?.user?.name}
                                className="w-full h-full rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`${reply?.user?.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                              <User className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900 text-sm">
                                {reply?.user?.name || "Anonymous User"}
                              </p>
                              {reply?.user?.role === 'instructor' && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  Instructor
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(reply.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {reply.edited && (
                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs ml-2">
                                  edited
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="relative group">
                          <button className="p-1 hover:bg-blue-100 rounded-full transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[100px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            {canEdit(comment, reply) && (
                              <button
                                onClick={() => startEdit(comment, reply)}
                                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                              >
                                <Edit className="w-3 h-3" />
                                Edit
                              </button>
                            )}
                            {canDelete(comment, reply) && (
                              <button
                                onClick={() => handleDeleteComment(comment, reply._id)}
                                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {editingComment?.comment._id === comment._id && editingComment.reply?._id === reply._id ? (
                        <div>
                          <textarea
                            rows={3}
                            className="w-full border-2 border-blue-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 resize-none"
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                          />
                          <div className="flex justify-end gap-2 mt-3">
                            <button
                              onClick={cancelEdit}
                              className="px-4 py-2 text-xs bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleEditComment(comment, reply._id)}
                              disabled={isSubmitting}
                              className="px-4 py-2 text-xs bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 hover:shadow-md transition-all duration-200 font-medium"
                            >
                              {isSubmitting ? 'Updating...' : 'Update Reply'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {reply?.content || "[No content available]"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No comments yet
            </h3>
            <p className="text-gray-500 mb-6">
              Be the first to share your thoughts and start the discussion!
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-green-100 rounded-2xl text-blue-700 font-medium">
              <MessageCircle className="w-5 h-5 mr-2" />
              Share your thoughts above
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
