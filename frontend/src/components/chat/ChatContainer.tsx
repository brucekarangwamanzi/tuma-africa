import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import ChatButton from './ChatButton';
import ChatInterface from './ChatInterface';

const ChatContainer: React.FC = () => {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Check if chat is enabled in settings
  const isChatEnabled = settings?.features?.enableChat !== false;

  // Don't show chat if not enabled or user not logged in
  if (!isChatEnabled || !user) {
    return null;
  }

  const handleToggleChat = () => {
    if (isChatOpen) {
      setIsChatOpen(false);
      setIsMinimized(false);
    } else {
      setIsChatOpen(true);
      setIsMinimized(false);
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setIsMinimized(false);
  };

  const handleMinimizeChat = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Chat Button - only show when chat is closed */}
      {!isChatOpen && (
        <ChatButton
          isOpen={isChatOpen}
          onClick={handleToggleChat}
        />
      )}

      {/* Chat Interface */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        onMinimize={handleMinimizeChat}
        isMinimized={isMinimized}
      />
    </>
  );
};

export default ChatContainer;