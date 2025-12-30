import { useState, useEffect, useRef } from 'react';
import { getModels, sendMessage } from './services/api';
import ChatSidebar from './components/ChatSidebar';
import ChatWindow from './components/ChatWindow';
import ModelSelector from './components/ModelSelector';
import './App.css';

function App() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);

  useEffect(() => {
    loadModels();
    loadChatsFromStorage();
  }, []);

  const loadModels = async () => {
    try {
      setLoadingModels(true);
      const modelsList = await getModels();
      setModels(modelsList);
      if (modelsList.length > 0 && !selectedModel) {
        setSelectedModel(modelsList[0].id);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadChatsFromStorage = () => {
    try {
      const saved = localStorage.getItem('kyvex_chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        setChats(parsed);
        if (parsed.length > 0 && !activeChatId) {
          setActiveChatId(parsed[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const saveChatsToStorage = (updatedChats) => {
    try {
      localStorage.setItem('kyvex_chats', JSON.stringify(updatedChats));
    } catch (error) {
      console.error('Failed to save chats:', error);
    }
  };

  const createNewChat = () => {
    const newChat = {
      id: `chat_${Date.now()}`,
      title: 'New Chat',
      messages: [],
      model: selectedModel,
      threadId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setActiveChatId(newChat.id);
    saveChatsToStorage(updatedChats);
    return newChat.id;
  };

  const deleteChat = (chatId) => {
    const updatedChats = chats.filter(c => c.id !== chatId);
    setChats(updatedChats);
    saveChatsToStorage(updatedChats);
    if (activeChatId === chatId) {
      setActiveChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
  };

  const updateChatTitle = (chatId, title) => {
    const updatedChats = chats.map(chat => 
      chat.id === chatId ? { ...chat, title, updatedAt: new Date().toISOString() } : chat
    );
    setChats(updatedChats);
    saveChatsToStorage(updatedChats);
  };

  const handleSendMessage = async (content) => {
    if (!content.trim() || !selectedModel) return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = createNewChat();
    }

    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const userMessage = {
      role: 'user',
      content: content.trim()
    };

    // Update chat with user message
    const updatedMessages = [...chat.messages, userMessage];
    const updatedChat = {
      ...chat,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };

    const updatedChats = chats.map(c => c.id === chatId ? updatedChat : c);
    setChats(updatedChats);
    saveChatsToStorage(updatedChats);

    // Add assistant message placeholder
    const assistantMessage = {
      role: 'assistant',
      content: '',
      streaming: true
    };

    const messagesWithPlaceholder = [...updatedMessages, assistantMessage];
    const chatWithPlaceholder = {
      ...updatedChat,
      messages: messagesWithPlaceholder
    };

    const chatsWithPlaceholder = chats.map(c => c.id === chatId ? chatWithPlaceholder : c);
    setChats(chatsWithPlaceholder);

    setLoading(true);

    try {
      let fullResponse = '';
      const onChunk = (chunk) => {
        fullResponse += chunk;
        const updatedMessages = messagesWithPlaceholder.map((msg, idx) => 
          idx === messagesWithPlaceholder.length - 1 
            ? { ...msg, content: fullResponse }
            : msg
        );
        const updatedChat = {
          ...chatWithPlaceholder,
          messages: updatedMessages
        };
        const updatedChats = chats.map(c => c.id === chatId ? updatedChat : c);
        setChats(updatedChats);
      };

      const result = await sendMessage(
        updatedMessages.slice(0, -1), // Exclude the placeholder
        selectedModel,
        chat.threadId,
        onChunk
      );

      // Update with final response and thread ID
      const finalMessages = messagesWithPlaceholder.map((msg, idx) => 
        idx === messagesWithPlaceholder.length - 1 
          ? { ...msg, content: result.content, streaming: false }
          : msg
      );

      const finalChat = {
        ...chatWithPlaceholder,
        messages: finalMessages,
        threadId: result.threadId,
        updatedAt: new Date().toISOString()
      };

      // Update title if it's still "New Chat"
      if (finalChat.title === 'New Chat' && finalMessages.length > 0) {
        const firstUserMessage = finalMessages.find(m => m.role === 'user');
        if (firstUserMessage) {
          finalChat.title = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
        }
      }

      const finalChats = chats.map(c => c.id === chatId ? finalChat : c);
      setChats(finalChats);
      saveChatsToStorage(finalChats);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove placeholder on error
      const errorChat = {
        ...chatWithPlaceholder,
        messages: updatedMessages
      };
      const errorChats = chats.map(c => c.id === chatId ? errorChat : c);
      setChats(errorChats);
      saveChatsToStorage(errorChats);
    } finally {
      setLoading(false);
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="app">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
      />
      <div className="main-content">
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          loading={loadingModels}
        />
        <ChatWindow
          chat={activeChat}
          onSendMessage={handleSendMessage}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default App;

