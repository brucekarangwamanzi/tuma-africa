import React, { useState } from 'react';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋'],
    'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    'Objects': ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥', '💯', '✅', '❌', '⚠️', '📌', '📍', '🔔']
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
        title="Add emoji"
      >
        <Smile className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Emoji Picker Popup */}
          <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 w-80 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {Object.entries(emojiCategories).map(([category, emojis]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">{category}</h4>
                  <div className="grid grid-cols-10 gap-1">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          onEmojiSelect(emoji);
                          setIsOpen(false);
                        }}
                        className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmojiPicker;
