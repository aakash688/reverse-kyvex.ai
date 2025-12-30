import axios from 'axios';

const API_URL = 'https://kyvex-api.proaiapirev1.workers.dev';
const API_KEY = 'kyvex_8f57308ca01e5ee842e724fda144b510fc90a3afd7fc18bdb3e867181c7b1217';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  timeout: 60000 // 60 seconds for streaming
});

export async function getModels() {
  try {
    const response = await api.get('/v1/models');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
}

export async function sendMessage(messages, model, threadId = null, onChunk = null) {
  try {
    const requestData = {
      model: model,
      messages: messages,
      stream: true,
      ...(threadId && { thread_id: threadId })
    };

    const response = await fetch(`${API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';
    let extractedThreadId = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            return { content: fullResponse, threadId: extractedThreadId || threadId };
          }

          try {
            const json = JSON.parse(data);
            if (json.choices && json.choices[0] && json.choices[0].delta) {
              const content = json.choices[0].delta.content || '';
              if (content) {
                fullResponse += content;
                if (onChunk) {
                  onChunk(content);
                }
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    return { content: fullResponse, threadId: extractedThreadId || threadId };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export default api;

