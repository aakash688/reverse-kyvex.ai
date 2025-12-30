/**
 * Kyvex.ai API proxy service
 */

/**
 * Forward chat request to kyvex.ai
 */
export async function forwardToKyvex(payload, kyvexCookie) {
  const kyvexUrl = 'https://kyvex.ai/api/v1/ai/stream';
  
  const response = await fetch(kyvexUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'User-Agent': 'Mozilla/5.0',
      'Origin': 'https://kyvex.ai',
      'Referer': 'https://kyvex.ai/',
      'Cookie': kyvexCookie
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Kyvex.ai API error: ${response.status} ${response.statusText}`);
  }

  return response;
}

/**
 * Transform messages array to single prompt
 */
export function extractUserPrompt(messages) {
  if (!messages || messages.length === 0) {
    return '';
  }

  const userMessages = messages.filter(msg => msg.role === 'user');
  if (userMessages.length === 0) {
    return '';
  }

  return userMessages[userMessages.length - 1].content || '';
}

/**
 * Transform kyvex.ai SSE stream to OpenAI format
 */
export function transformStreamToOpenAI(stream, onThreadId) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) {
              continue;
            }

            const data = line.substring(6);

            const threadIdMatch = data.match(/\[THREAD_ID:(.*?)\]/);
            if (threadIdMatch && onThreadId) {
              const kyvexThreadId = threadIdMatch[1].trim();
              onThreadId(kyvexThreadId);
              
              const conversationIdData = JSON.stringify({ conversation_id: kyvexThreadId });
              controller.enqueue(new TextEncoder().encode(`data: ${conversationIdData}\n\n`));
            }

            if (threadIdMatch) {
              continue;
            }

            if (data.includes('<think>') || data.includes('</think>')) {
              continue;
            }

            const openAIFormat = {
              choices: [{
                delta: {
                  content: data
                }
              }]
            };

            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(openAIFormat)}\n\n`)
            );
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    }
  });
}