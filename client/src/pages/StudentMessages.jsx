import React, { useState } from "react";
import { 
  MessageSquare, 
  Send, 
  Search, 
  User, 
  Clock, 
  Plus,
  Filter,
  AlertCircle,
  Mail,
  MailOpen,
  Star,
  Archive
} from "lucide-react";
import { 
  useGetConversationsQuery, 
  useGetConversationQuery, 
  useSendMessageMutation,
  useMarkAsReadMutation 
} from "../store/services/messageApi";
import { toast } from "react-toastify";
import StartConversation from "../components/StartConversation";
import { useSelector } from "react-redux";

const StudentMessages = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isStartConversationOpen, setIsStartConversationOpen] = useState(false);

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
        await sendMessage({
          receiverId: selectedConversation.otherUser._id,
          subject: "Message", // You can add a subject field if needed
          content: newMessage,
          courseId: selectedConversation.course?._id,
        }).unwrap();
        
        setNewMessage("");
        toast.success("Message sent successfully!");
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
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
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💬 Messages
          </h1>
          <p className="text-gray-600">
            Communicate with your instructors and get help with your courses
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: "70vh" }}>
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Search and Filter */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative mb-3">
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
                  {[
                    { key: "all", label: "All", count: conversations.length },
                    { key: "unread", label: "Unread", count: conversations.filter(c => c.unreadCount > 0).length },
                    { key: "read", label: "Read", count: conversations.filter(c => c.unreadCount === 0).length }
                  ].map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => setFilterStatus(key)}
                      className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                        filterStatus === key
                          ? "bg-blue-500 text-white"
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      {label} ({count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages</h3>
                    <p className="text-gray-600 text-sm">
                      {conversations.length === 0 
                        ? "You don't have any messages yet. Start a conversation with your instructors!"
                        : "No conversations match your search."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? "bg-blue-50 border-l-4 border-blue-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {conversation.otherUser?.name}
                              </h4>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-1 truncate">
                              {conversation.course?.[0]?.title || "General Message"}
                            </p>
                            
                            <p className="text-xs text-gray-500 truncate">
                              {conversation.lastMessage?.content}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {formatTime(conversation.lastMessage?.createdAt)}
                              </span>
                              {conversation.lastMessage?.isRead ? (
                                <MailOpen className="w-3 h-3 text-gray-400" />
                              ) : (
                                <Mail className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedConversation.otherUser?.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedConversation.course?.[0]?.title || "General Message"}
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
                        
                        console.log("🔍 Message debug:", {
                          messageId: message._id,
                          senderId: message.sender?._id,
                          currentUserId: currentUserId,
                          isFromCurrentUser,
                          content: message.content?.substring(0, 50)
                        });
                        
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
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* No Conversation Selected */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Select a Conversation
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Choose a conversation from the sidebar to start messaging
                    </p>
                    <button 
                    onClick={() => setIsStartConversationOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Message</span>
                  </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Messaging Guidelines</h4>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Be respectful and professional in all communications
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Include specific details about your questions or issues
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Allow 24-48 hours for instructor responses
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  For urgent matters, contact course support directly
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Start Conversation Modal */}
        <StartConversation
          isOpen={isStartConversationOpen}
          onClose={() => setIsStartConversationOpen(false)}
        />
      </div>
    </div>
  );
};

export default StudentMessages;
