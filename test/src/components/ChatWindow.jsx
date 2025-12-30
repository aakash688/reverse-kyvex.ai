import { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './ChatWindow.css';

export default function ChatWindow({ chat, onSendMessage, loading }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  if (!chat) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <h2>Welcome to Kyvex Chat</h2>
          <p>Select a model and start a new conversation</p>
          <p className="hint">Click "New Chat" to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{chat.title}</h3>
        <span className="message-count">{chat.messages.length} messages</span>
      </div>
      <MessageList messages={chat.messages} />
      <div ref={messagesEndRef} />
      <MessageInput onSendMessage={onSendMessage} loading={loading} />
    </div>
  );
}

