import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  MessageSquare,
  Send,
  MoreVertical,
  User,
  Clock,
  Archive
} from "lucide-react";
import { 
  useGetConversationsQuery, 
  useGetConversationQuery, 
  useSendMessageMutation,
  useMarkAsReadMutation 
} from "../store/services/messageApi";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const InstructorMessages = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showSubjectField, setShowSubjectField] = useState(false);

  // Get current user
  const { user } = useSelector((state) => state.auth);
  const currentUserId = user?.id || user?._id;

  // API calls
  const { data: conversationsData, isLoading: conversationsLoading, error: conversationsError } = useGetConversationsQuery();
  const { data: messagesData, isLoading: messagesLoading } = useGetConversationQuery(
    { userId: selectedConversation?.otherUser?._id },
    { skip: !selectedConversation }
  );
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [markAsRead] = useMarkAsReadMutation();

  const conversations = conversationsData?.data || [];
  const messages = messagesData?.data || [];

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedConversation) {
      try {
        const messageData = {
          receiverId: selectedConversation.otherUser._id,
          content: newMessage.trim(),
          courseId: selectedConversation.course?.[0]?._id || null,
        };
        
        // Include subject if provided (for new conversations or when subject field is shown)
        if (newSubject.trim()) {
          messageData.subject = newSubject.trim();
        }
        
        await sendMessage(messageData).unwrap();
        
        setNewMessage("");
        setNewSubject("");
        setShowSubjectField(false);
        toast.success("Message sent successfully!");
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
      }
    }
  };

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    
    // Mark messages as read
    if (conversation.unreadCount > 0) {
      try {
        await markAsRead(conversation.lastMessage._id);
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.course?.[0]?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "unread") return matchesSearch && conv.unreadCount > 0;
    if (filterStatus === "read") return matchesSearch && conv.unreadCount === 0;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-indigo-600 bg-clip-text text-transparent">
                💬 Instructor Messages
              </h1>
              <p className="text-gray-600 mt-2">
                Communicate with your students and administrators
              </p>
            </div>
          </div>
        </div>

        {/* Messages Interface */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: "70vh" }}>
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Search and Filters */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilterStatus("all")}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filterStatus === "all"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus("unread")}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filterStatus === "unread"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Unread
                  </button>
                  <button
                    onClick={() => setFilterStatus("read")}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filterStatus === "read"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Read
                  </button>
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {conversationsLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading conversations...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation._id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?._id === conversation._id ? "bg-blue-50 border-blue-200" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {conversation.otherUser?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 truncate">
                              {conversation.otherUser?.name || "Unknown User"}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessage?.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.course?.[0]?.title || "General Message"}
                          </p>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {conversation.lastMessage?.content}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="inline-block bg-blue-500 text-white text-xs rounded-full px-2 py-1 mt-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedConversation.otherUser?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.otherUser?.name || "Unknown User"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedConversation.otherUser?.role || "User"} • {selectedConversation.course?.[0]?.title || "General Message"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        // Check if message is from current user by comparing sender ID with current user ID
                        const isFromCurrentUser = message.sender?._id === currentUserId || message.sender?._id?.toString() === currentUserId?.toString();
                        
                        return (
                          <div
                            key={message._id}
                            className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isFromCurrentUser
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isFromCurrentUser ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    {/* Subject field (optional) */}
                    {showSubjectField && (
                      <div className="mb-3">
                        <input
                          type="text"
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          placeholder="Subject (optional)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSending}
                        />
                      </div>
                    )}
                    
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSending}
                      />
                      
                      {/* Subject toggle button */}
                      <button
                        onClick={() => setShowSubjectField(!showSubjectField)}
                        className="px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Add subject"
                      >
                        📝
                      </button>
                      
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                    <p>Choose a conversation from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorMessages;
