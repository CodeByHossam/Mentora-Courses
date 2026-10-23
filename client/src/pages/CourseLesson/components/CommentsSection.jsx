import React from 'react';
import { User } from 'lucide-react';

const CommentsSection = ({ 
  user, 
  interactions, 
  commentText, 
  setCommentText, 
  isAddingComment, 
  isDeletingComment, 
  handleCommentSubmit, 
  handleCommentDelete 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
      <div className="flex items-center mb-6">
        <div className="text-3xl mr-3">💬</div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Discussion
        </h2>
      </div>
      <div className="space-y-6">
        {interactions?.comments?.length > 0 ? (
          interactions.comments.map((comment) => (
            <div
              key={comment._id}
              className="border-l-4 border-blue-500 pl-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-r-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full mr-3 ring-2 ring-blue-200 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    {comment.user?.avatar ? (
                      <img
                        src={comment.user.avatar}
                        alt={comment.user?.name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`${comment.user?.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">
                      {comment.user?.name}
                    </span>
                    <span className="text-gray-500 text-sm ml-3">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {(user?.role === "admin" ||
                  comment.user?._id === user?._id) && (
                  <button
                    onClick={() =>
                      handleCommentDelete(comment._id)
                    }
                    className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded-lg hover:bg-red-50 transition-all"
                    disabled={isDeletingComment}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
              <p className="text-gray-700 leading-relaxed">{comment.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🤔</div>
            <p className="text-gray-500 text-lg">No comments yet.</p>
            <p className="text-gray-400 text-sm mt-2">Be the first to start the discussion!</p>
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleCommentSubmit} className="mt-8">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full ring-2 ring-gray-200 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`${user?.avatar ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts about this lesson..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              rows="4"
            />
            <div className="flex justify-between items-center mt-3">
              <span className={`text-sm ${commentText.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                {commentText.length}/500 characters
              </span>
              <button
                type="submit"
                disabled={
                  !commentText.trim() ||
                  commentText.length > 500 ||
                  isAddingComment
                }
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium transform hover:scale-105 disabled:transform-none"
              >
                {isAddingComment ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Posting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="mr-2">💭</span>
                    Post Comment
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CommentsSection;
