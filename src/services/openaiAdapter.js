import kyvexService from './kyvexService.js';
import { logger } from '../utils/logger.js';

/**
 * Adapter to convert between OpenAI and Kyvex.ai formats
 */
class OpenAIAdapter {
  /**
   * Convert OpenAI request to Kyvex format
   * @param {Object} openaiRequest - OpenAI format request
   * @param {string} kyvexThreadId - Kyvex thread ID (optional)
   * @returns {Object} - Kyvex format request
   */
  convertRequestToKyvex(openaiRequest, kyvexThreadId = null) {
    const {
      model = 'claude-sonnet-4.5',
      messages = [],
      stream = true,
      files = [],
      inputAudio = '',
      webSearch = false,
      generateImage = false,
      reasoning = false,
      autoRoute = false,
    } = openaiRequest;

    // Convert messages array to prompt string
    // Combine all messages into a single prompt
    let prompt = '';
    for (const message of messages) {
      const role = message.role;
      const content = message.content;
      
      if (role === 'system') {
        prompt += `System: ${content}\n\n`;
      } else if (role === 'user') {
        prompt += `User: ${content}\n\n`;
      } else if (role === 'assistant') {
        prompt += `Assistant: ${content}\n\n`;
      }
    }

    // Remove trailing newlines
    prompt = prompt.trim();

    const kyvexRequest = {
      model,
      prompt,
      webSearch: webSearch || false,
      generateImage: generateImage || false,
      reasoning: reasoning || false,
      files: files || [],
      inputAudio: inputAudio || '',
      autoRoute: autoRoute || false,
    };

    // Add thread ID if provided
    if (kyvexThreadId) {
      kyvexRequest.threadId = kyvexThreadId;
    }

    return kyvexRequest;
  }

  /**
   * Convert Kyvex SSE stream to OpenAI format
   * @param {ReadableStream} kyvexStream - Kyvex stream
   * @param {Function} onThreadId - Callback when thread ID is extracted
   * @returns {ReadableStream} - OpenAI format stream
   */
  convertStreamToOpenAI(kyvexStream, onThreadId = null) {
    let buffer = '';
    let threadIdExtracted = false;
    let isFirstChunk = true;

    const transformStream = new ReadableStream({
      async start(controller) {
        // Send initial OpenAI format chunk
        if (isFirstChunk) {
          controller.enqueue(
            new TextEncoder().encode('data: {"id":"chatcmpl-001","object":"chat.completion.chunk","created":' + Date.now() + ',"model":"kyvex","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}\n\n')
          );
          isFirstChunk = false;
        }

        kyvexStream.on('data', (chunk) => {
          try {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6).trim();

                // Check for thread ID
                if (!threadIdExtracted && data.includes('[THREAD_ID:')) {
                  const threadId = kyvexService.extractThreadId(data);
                  if (threadId && onThreadId) {
                    onThreadId(threadId);
                    threadIdExtracted = true;
                  }
                }

                // Skip thread ID line and [DONE] marker
                if (data.includes('[THREAD_ID:') || data === '[DONE]') {
                  if (data === '[DONE]') {
                    // Send final chunk
                    controller.enqueue(
                      new TextEncoder().encode('data: {"id":"chatcmpl-001","object":"chat.completion.chunk","created":' + Date.now() + ',"model":"kyvex","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n')
                    );
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                  }
                  continue;
                }

                // Remove redacted reasoning tags if present
                let content = data;
                content = content.replace(/<think>.*?<\/redacted_reasoning>/gs, '');

                if (content.trim()) {
                  // Convert to OpenAI format
                  const openaiChunk = {
                    id: 'chatcmpl-001',
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: 'kyvex',
                    choices: [
                      {
                        index: 0,
                        delta: {
                          content: content,
                        },
                        finish_reason: null,
                      },
                    ],
                  };

                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify(openaiChunk)}\n\n`)
                  );
                }
              }
            }
          } catch (error) {
            logger.error('Stream conversion error:', error);
            controller.error(error);
          }
        });

        kyvexStream.on('end', () => {
          // Send final chunk
          controller.enqueue(
            new TextEncoder().encode('data: {"id":"chatcmpl-001","object":"chat.completion.chunk","created":' + Date.now() + ',"model":"kyvex","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n')
          );
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        });

        kyvexStream.on('error', (error) => {
          logger.error('Kyvex stream error:', error);
          controller.error(error);
        });
      },
    });

    return transformStream;
  }

  /**
   * Convert Kyvex models response to OpenAI format
   * @param {Object} kyvexResponse - Kyvex models response
   * @returns {Object} - OpenAI format response
   */
  convertModelsToOpenAI(kyvexResponse) {
    if (!kyvexResponse.data || !Array.isArray(kyvexResponse.data)) {
      return {
        object: 'list',
        data: [],
      };
    }

    const models = kyvexResponse.data.map((model) => ({
      id: model.id,
      object: 'model',
      created: Math.floor(new Date(model.createdAt || Date.now()).getTime() / 1000),
      owned_by: model.provider || 'kyvex',
      permission: [],
      root: model.id,
      parent: null,
    }));

    return {
      object: 'list',
      data: models,
    };
  }

  /**
   * Convert non-streaming response (if needed)
   * @param {string} content - Response content
   * @returns {Object} - OpenAI format response
   */
  convertNonStreamingResponse(content) {
    return {
      id: 'chatcmpl-001',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'kyvex',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: content,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }
}

export default new OpenAIAdapter();

