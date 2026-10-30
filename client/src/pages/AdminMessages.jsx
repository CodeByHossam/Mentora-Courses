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

const AdminMessages = () => {
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

  return <AdminMessagesView />;
};

export default AdminMessages;
