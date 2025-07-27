import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const ChatMessage = ({ message }) => {
  const { sender, text, type, timestamp, data } = message;

  const isUser = sender === 'user';
  const messageTime = timestamp ? format(new Date(timestamp), 'HH:mm') : '';

  const getMessageIcon = () => {
    switch (type) {
      case 'voice':
        return '🎤';
      case 'ai':
        return '🤖';
      case 'welcome':
        return '👋';
      case 'error':
        return '❌';
      case 'feature':
        return '🚀';
      default:
        return isUser ? '👤' : '🤖';
    }
  };

  const getMessageClass = () => {
    const baseClass = 'message';
    const senderClass = isUser ? 'user' : 'robot';
    const typeClass = type || 'text';

    return `${baseClass} ${senderClass} ${typeClass}`;
  };

  const renderMessageContent = () => {
    switch (type) {
      case 'feature':
        return (
          <div className="feature-message">
            <div className="feature-icon">🚀</div>
            <div className="feature-content">
              <div className="feature-title">{text}</div>
              {data?.feature && (
                <div className="feature-details">
                  Feature: {data.feature}
                </div>
              )}
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <div className="error-text">{text}</div>
          </div>
        );

      case 'welcome':
        return (
          <div className="welcome-message">
            <div className="welcome-icon">👋</div>
            <div className="welcome-text">{text}</div>
          </div>
        );

      default:
        return (
          <div className="text-message">
            {text}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={getMessageClass()}
    >
      <div className="message-container">
        <div className="message-icon">
          {getMessageIcon()}
        </div>

        <div className="message-content">
          {renderMessageContent()}

          {messageTime && (
            <div className="message-time">
              {messageTime}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
