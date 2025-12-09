import React, { useState } from 'react';
import { MessageCircle, X, Headphones } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

const ChatButton: React.FC<ChatButtonProps> = ({ 
  isOpen, 
  onClick, 
  className = '' 
}) => {
  const { unreadCount } = useChatStore();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Tooltip */}
      {!isOpen && isHovered && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap animate-fadeIn">
          Need help? Chat with us!
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
      
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${className}`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {/* Ripple effect background */}
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        
        {/* Pulse animation for unread messages */}
        {!isOpen && unreadCount > 0 && (
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
        )}
        
        <div className="relative">
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" />
          ) : (
            <>
              <div className="relative">
                <MessageCircle className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
                
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              
              {unreadCount > 0 && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center animate-bounce shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Support icon overlay when hovering */}
        {!isOpen && isHovered && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-white opacity-50" />
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatButton;