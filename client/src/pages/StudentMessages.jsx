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

  return null;
};

export default StudentMessages;
