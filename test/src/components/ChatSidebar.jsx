import './ChatSidebar.css';

export default function ChatSidebar({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat }) {
  return (
    <div className="sidebar">
      <button className="new-chat-button" onClick={onNewChat}>
        <span>+</span> New Chat
      </button>
      
      <div className="chats-list">
        {chats.length === 0 ? (
          <div className="empty-state">
            <p>No chats yet</p>
            <p className="hint">Start a new conversation</p>
          </div>
        ) : (
          chats.map(chat => (
            <div
              key={chat.id}
              className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="chat-item-content">
                <span className="chat-title">{chat.title}</span>
                <span className="chat-date">
                  {new Date(chat.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                className="delete-chat-button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this chat?')) {
                    onDeleteChat(chat.id);
                  }
                }}
                title="Delete chat"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

