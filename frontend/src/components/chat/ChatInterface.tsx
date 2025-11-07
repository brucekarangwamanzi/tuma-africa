import React, { useEffect, useState, useRef } from "react";
import {
  MessageCircle,
  Send,
  Paperclip,
  X,
  Minimize2,
  Maximize2,
  User,
  Clock,
  Check,
  CheckCheck,
  Image,
  FileText,
  Download,
  Smile,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { formatDistanceToNow } from "date-fns";
import EmojiPicker from "./EmojiPicker";

// Add custom styles for animations
const chatStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.4s ease-out;
  }
  
  .chat-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  
  .chat-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .chat-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
  
  .chat-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = chatStyles;
  if (!document.head.querySelector("style[data-chat-styles]")) {
    styleElement.setAttribute("data-chat-styles", "true");
    document.head.appendChild(styleElement);
  }
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "user" | "admin" | "super_admin";
  content: string;
  type: "text" | "image" | "file";
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
  status: "sending" | "sent" | "delivered" | "read";
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen,
  onClose,
  onMinimize,
  isMinimized,
}) => {
  const { user } = useAuthStore();
  const {
    messages,
    isLoading,
    isConnected,
    fetchMessages,
    sendMessage,
    markAllAsRead,
  } = useChatStore();

  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchMessages();
    }
  }, [isOpen, user, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when chat is open
    if (isOpen && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== user?.id && msg.status !== "read"
      );
      if (unreadMessages.length > 0) {
        markAllAsRead();
      }
    }
  }, [isOpen, messages, user?.id, markAllAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() && !selectedFile) return;
    if (!user) return;

    try {
      await sendMessage({
        content: newMessage.trim(),
        type: selectedFile ? "file" : "text",
        file: selectedFile || undefined,
      });

      setNewMessage("");
      setSelectedFile(null);
      setFilePreview(null);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const getMessageStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "sending":
        return <Clock className="w-3 h-3 text-gray-400" />;
      case "sent":
        return <Check className="w-3 h-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 overflow-hidden animate-slideUp ${
        isMinimized ? "w-80 h-12" : "w-96 h-[600px]"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {isConnected && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">Customer Support</h3>
            <p className="text-xs opacity-90 flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-yellow-400"
                }`}
              ></div>
              <span>
                {isConnected
                  ? "Online • Typically replies instantly"
                  : "Connecting..."}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onMinimize}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-3 h-96 chat-scrollbar ${
              isDragOver
                ? "bg-blue-50 border-2 border-dashed border-blue-300"
                : ""
            }`}
          >
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 z-10">
                <div className="text-center">
                  <Paperclip className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                  <p className="text-blue-600 font-medium">
                    Drop your file here
                  </p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-700 mb-2">
                  Welcome to Support
                </h4>
                <p className="text-sm mb-1">No messages yet</p>
                <p className="text-xs text-gray-400">
                  Start a conversation with our support team
                </p>
                <div className="mt-4 flex justify-center space-x-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Quick Response
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    24/7 Support
                  </span>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.senderId === user?.id;
                const showAvatar =
                  !isOwn &&
                  (index === 0 ||
                    messages[index - 1].senderId !== message.senderId);

                return (
                  <div
                    key={message.id}
                    className={`flex items-end space-x-2 ${
                      isOwn ? "justify-end" : "justify-start"
                    } animate-fadeIn`}
                  >
                    {!isOwn && (
                      <div className="w-8 h-8 flex-shrink-0">
                        {showAvatar && (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`max-w-xs lg:max-w-md ${
                        isOwn ? "order-1" : ""
                      }`}
                    >
                      {!isOwn && showAvatar && (
                        <div className="mb-1 ml-1">
                          <span className="text-xs font-medium text-gray-600">
                            {message.senderName}
                            {message.senderRole === "admin" && (
                              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Support
                              </span>
                            )}
                            {message.senderRole === "super_admin" && (
                              <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                Admin
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm ${
                          isOwn
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md"
                            : "bg-white border border-gray-200 text-gray-900 rounded-bl-md"
                        }`}
                      >
                        {message.type === "text" ? (
                          <p className="text-sm leading-relaxed">
                            {message.content}
                          </p>
                        ) : message.type === "file" ? (
                          <div className="space-y-3">
                            {message.content && (
                              <p className="text-sm leading-relaxed">
                                {message.content}
                              </p>
                            )}
                            <div
                              className={`flex items-center space-x-3 p-3 rounded-lg ${
                                isOwn ? "bg-white bg-opacity-20" : "bg-gray-50"
                              }`}
                            >
                              {getFileIcon(message.fileName || "")}
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium truncate ${
                                    isOwn ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {message.fileName}
                                </p>
                              </div>
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-500 transition-colors ${
                                  isOwn ? "text-white" : "text-gray-600"
                                }`}
                                title="Download file"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ) : message.type === "image" ? (
                          <div className="space-y-2">
                            {message.content && (
                              <p className="text-sm leading-relaxed">
                                {message.content}
                              </p>
                            )}
                            <img
                              src={message.fileUrl}
                              alt={message.fileName}
                              className="max-w-full h-auto rounded-lg"
                            />
                          </div>
                        ) : null}

                        <div
                          className={`flex items-center justify-between mt-2 text-xs ${
                            isOwn ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          <span>{formatMessageTime(message.timestamp)}</span>
                          {isOwn && (
                            <div className="ml-2 flex items-center">
                              {getMessageStatusIcon(message.status)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isOwn && (
                      <div className="w-8 h-8 flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator */}
          {isTyping && (
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">
                    Support is typing
                  </span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Preview */}
          {selectedFile && (
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getFileIcon(selectedFile.name)}
                    <span className="text-sm font-medium text-gray-700">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>

                  {filePreview && (
                    <div className="mt-2">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="max-w-full h-20 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={clearSelectedFile}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white rounded-full transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-gray-200 bg-gray-50"
          >
            <div className="flex items-end space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />

              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                  title="Attach file"
                  disabled={!isConnected}
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <EmojiPicker
                  onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)}
                />
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    isConnected ? "Type your message..." : "Connecting..."
                  }
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm resize-none"
                  disabled={!isConnected}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />

                <button
                  type="submit"
                  disabled={
                    (!newMessage.trim() && !selectedFile) || !isConnected
                  }
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isConnected && (
              <div className="mt-2 text-xs text-amber-600 flex items-center space-x-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <span>Reconnecting to support...</span>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
};

export default ChatInterface;
