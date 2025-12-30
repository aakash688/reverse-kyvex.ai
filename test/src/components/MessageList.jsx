import './MessageList.css';

export default function MessageList({ messages }) {
  if (!messages || messages.length === 0) {
    return (
      <div className="message-list empty">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
        >
          <div className="message-content">
            <div className="message-role">
              {message.role === 'user' ? 'You' : 'Kyvex'}
            </div>
            <div className="message-text">
              {message.content || (message.streaming ? '...' : '')}
              {message.streaming && (
                <span className="typing-indicator">▋</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

