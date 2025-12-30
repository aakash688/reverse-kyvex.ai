# Kyvex Chat - API Test Interface

A ChatGPT-like interface to test the Kyvex API with model selection and chat management.

## Features

- 🤖 Model selection dropdown
- 💬 Chat interface similar to ChatGPT
- 📝 Multiple chat sessions
- 💾 Local storage for chat history
- 🔄 Real-time streaming responses
- 🎨 Dark theme UI

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Build for production:**
```bash
npm run build
```

## Usage

1. Select a model from the dropdown
2. Click "New Chat" to start a conversation
3. Type your message and press Enter (or Shift+Enter for new line)
4. View streaming responses in real-time
5. Create multiple chats and switch between them
6. Delete chats you no longer need

## API Configuration

The API key is hardcoded in `src/services/api.js`. To change it:
- Edit `API_KEY` constant in `src/services/api.js`
- Or set it via environment variable (requires build config changes)

## Storage

Chats are stored in browser localStorage under the key `kyvex_chats`. Each chat includes:
- Messages history
- Thread ID (for context)
- Selected model
- Timestamps

