/**
 * Chat completions handler
 */

import { verifyApiKey, errorResponse } from '../middleware/auth.js';
import { getOrCreateThread, updateThreadWithKyvexId } from '../services/threadService.js';
import { updateApiKeyAnalytics } from '../services/apiKey.js';
import { proxyToKyvex } from '../services/kyvex.js';
import { getModelByCustomName } from '../services/modelService.js';
import { 
  getAvailableCookie, 
  incrementUsage, 
  checkAndReplenishPool 
} from '../services/cookieService.js';
// Generate UUID for conversation ID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


/**
 * Handle chat completions request
 */
export async function handleChatCompletions(request) {
  try {
    // Verify API key
    const authResult = await verifyApiKey(request);
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status);
    }

    const apiKey = authResult.apiKey;

    // API-level rate limiting removed - unlimited conversations supported via cookie rotation
    const apiKeyId = apiKey.id || apiKey._id;

    // Parse request body
    const body = await request.json();
    const { model, messages, conversation_id, stream = true, temperature, max_tokens, ...otherParams } = body;

    if (!model || !messages || messages.length === 0) {
      return errorResponse('Missing required fields: model and messages', 400);
    }

    // Map custom model name to provider model name
    const modelMapping = await getModelByCustomName(model);
    if (!modelMapping || !modelMapping.is_active) {
      return errorResponse(`Model "${model}" is not available or inactive`, 400);
    }

    const providerModel = modelMapping.provider_name;
    const customModel = modelMapping.custom_name;
    const brandName = modelMapping.brand_name || 'Sahyog';

    // Get conversation ID
    const convId = conversation_id || `conv_${generateUUID()}`;

    // Get or create thread
    const kyvexThreadId = await getOrCreateThread(apiKeyId, convId);

    // Extract user message (last message)
    // Handle OpenAI vision format: content can be string or array of text/image objects
    const lastMessage = messages[messages.length - 1];
    let userMessage = '';
    let imageFiles = [];
    
    if (typeof lastMessage.content === 'string') {
      userMessage = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      // OpenAI vision format: content is array of {type: "text", text: "..."} or {type: "image_url", image_url: {...}}
      const textParts = [];
      for (const part of lastMessage.content) {
        if (part.type === 'text') {
          textParts.push(part.text);
        } else if (part.type === 'image_url') {
          // Extract image URL or base64 data
          const imageUrl = part.image_url?.url || part.image_url;
          if (imageUrl) {
            imageFiles.push(imageUrl);
            textParts.push('[IMAGE]'); // Placeholder for image in text
          }
        }
      }
      userMessage = textParts.join(' ');
    } else {
      userMessage = String(lastMessage.content || '');
    }
    
    // Merge OpenAI format images with files parameter
    const allFiles = [...imageFiles, ...(otherParams.files || [])];

    // Build kyvex payload with provider model name
    const kyvexPayload = {
      model: providerModel, // Use provider model name for kyvex
      prompt: userMessage,
      threadId: kyvexThreadId || null,
      webSearch: otherParams.webSearch || false,
      generateImage: otherParams.generateImage || false,
      reasoning: otherParams.reasoning || false,
      files: allFiles, // Include images from OpenAI format + files parameter
      inputAudio: otherParams.inputAudio || '',
      autoRoute: otherParams.autoRoute || false,
    };

    // Get cookie from pool for this request
    let selectedCookie = null;
    let cookieId = null;
    let browserIdToUse = null;
    
    // Try to get a cookie from the pool
    selectedCookie = await getAvailableCookie();
    
    if (selectedCookie) {
      cookieId = selectedCookie.id;
      browserIdToUse = selectedCookie.browser_id;
      console.log(`[Chat] Using cookie: ${browserIdToUse} (usage: ${selectedCookie.usage_count}/45)`);
    } else {
      // No cookies available - trigger replenishment
      console.log('[Chat] No available cookies, triggering auto-generation...');
      checkAndReplenishPool().catch(err => {
        console.error('[Chat] Replenish failed:', err.message);
      });
      
      // Generate a one-time browser ID as fallback
      const { generateBrowserId } = await import('../services/cookieService.js');
      browserIdToUse = generateBrowserId();
      console.log(`[Chat] Using temporary browser ID: ${browserIdToUse}`);
    }

    // Build cookie string for request
    const cookieString = `browserId=${browserIdToUse}`;
    
    // Proxy to kyvex with browser ID cookie
    let kyvexResponse;
    
    try {
      kyvexResponse = await proxyToKyvex(kyvexPayload, cookieString, null);
    } catch (error) {
      console.error('[Chat] Kyvex request failed:', error.message);
      throw error;
    }

    // Update analytics (use custom model name)
    await updateApiKeyAnalytics(apiKeyId, {
      incrementRequests: true,
      model: customModel, // Store custom model name in analytics
      addTokens: max_tokens || 0, // Estimate
    });

    // Increment cookie usage (will delete if threshold reached)
    if (cookieId) {
      incrementUsage(cookieId).catch(err => {
        console.error('[Chat] Failed to increment cookie usage:', err.message);
      });
    }

    // Stream response (pass custom model name, brand name for response mapping)
    if (stream) {
      return streamResponse(kyvexResponse, customModel, brandName, convId, apiKeyId, cookieId);
    } else {
      // Non-streaming (collect all chunks)
      const reader = kyvexResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let threadId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            const extractedThreadId = /\[THREAD_ID:(.*?)\]/.exec(data)?.[1]?.trim();
            if (extractedThreadId && !threadId) {
              threadId = extractedThreadId;
            }

            const content = data
              .replace(/\[THREAD_ID:.*?\]/g, '')
              .replace(/<think>.*?<\/redacted_reasoning>/g, '')
              .trim();

            if (content) {
              fullContent += content;
            }
          }
        }
      }

      if (threadId && !kyvexThreadId) {
        await updateThreadWithKyvexId(apiKeyId, convId, threadId);
      }

      // Check for rate limit in response
      if (detectRateLimit(fullContent)) {
        console.log('[Chat] Rate limit detected in response');
        // The cookie will be auto-deleted when it reaches 45 uses
        // Trigger pool replenishment
        checkAndReplenishPool().catch(err => {
          console.error('[Chat] Replenish failed:', err.message);
        });
        return errorResponse('Rate limit reached. Please try again.', 429);
      }

      // Replace kyvex.ai URLs with aakashsingh.com and Kyvex brand with sahyogAI
      const replacedContent = replaceKyvexBrand(replaceKyvexUrls(fullContent));

      return new Response(
        JSON.stringify({
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: customModel, // Return custom model name, not provider name
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: replacedContent,
            },
            finish_reason: 'stop',
          }],
          conversation_id: convId,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    console.error('Chat completions error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

/**
 * Detect rate limit in response content
 */
function detectRateLimit(content) {
  if (!content) return false;
  const lowerContent = content.toLowerCase();
  return lowerContent.includes('text prompts limit reached') || 
         lowerContent.includes('limit reached') ||
         lowerContent.includes('sign up') && lowerContent.includes('limit');
}

/**
 * Replace kyvex.ai URLs with aakashsingh.com
 */
function replaceKyvexUrls(content) {
  if (!content) return content;
  // Replace all occurrences of kyvex.ai with aakashsingh.com
  return content.replace(/kyvex\.ai/gi, 'aakashsingh.com');
}

/**
 * Replace "Kyvex" brand name with "sahyogAI" (case-insensitive)
 */
function replaceKyvexBrand(content) {
  if (!content) return content;
  // Replace all occurrences of "Kyvex" (case-insensitive) with "sahyogAI"
  // Use word boundary to avoid replacing parts of other words
  return content.replace(/\bKyvex\b/gi, 'sahyogAI');
}

/**
 * Stream response from kyvex
 * Fixed to prevent hanging worker issue
 */
async function streamResponse(kyvexResponse, customModel, brandName, conversationId, apiKeyId, cookieId) {
  const encoder = new TextEncoder();
  const reader = kyvexResponse.body.getReader();
  const decoder = new TextDecoder();
  const chatId = `chatcmpl-${Date.now()}`;
  const created = Math.floor(Date.now() / 1000);
  let threadId = null;
  let threadIdSet = false;
  let isClosed = false;
  let fullStreamContent = '';
  let rateLimitDetected = false;
  let buffer = ''; // Buffer for incomplete lines

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (!isClosed) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Process any remaining buffered data
            if (buffer.trim()) {
              const lines = buffer.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data && data !== '[DONE]') {
                    // Extract thread ID if present
                    const match = /\[THREAD_ID:(.*?)\]/.exec(data);
                    if (match && !threadId) {
                      threadId = match[1].trim();
                      if (!threadIdSet) {
                        try {
                          await updateThreadWithKyvexId(apiKeyId, conversationId, threadId);
                          threadIdSet = true;
                        } catch (err) {
                          console.error('Error updating thread:', err);
                        }
                      }
                    }
                    
                    let content = data
                      .replace(/\[THREAD_ID:.*?\]/g, '')
                      .replace(/<think>.*?<\/redacted_reasoning>/g, '')
                      .replace(/<think>.*?<\/think>/g, '')
                      .trim();
                    
                    if (content) {
                      fullStreamContent += content;
                      // Replace URLs and brand name
                      const replacedContent = replaceKyvexBrand(replaceKyvexUrls(content));
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                          id: chatId,
                          object: 'chat.completion.chunk',
                          created,
                          model: customModel,
                          choices: [{
                            index: 0,
                            delta: { content: replacedContent },
                            finish_reason: null,
                          }],
                        })}\n\n`)
                      );
                    }
                  }
                }
              }
            }
            
            // Send final chunk with custom model name
            if (!isClosed) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  id: chatId,
                  object: 'chat.completion.chunk',
                  created,
                  model: customModel,
                  choices: [{
                    index: 0,
                    delta: {},
                    finish_reason: 'stop',
                  }],
                })}\n\n`)
              );
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            }
            isClosed = true;
            break;
          }

          // Decode chunk and append to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process complete lines (ending with \n)
          const lines = buffer.split('\n');
          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (isClosed) break;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              // Don't close on [DONE] from kyvex - wait for reader to be done
              // [DONE] from kyvex is just a marker, not the end of stream
              if (data === '[DONE]') {
                // Just forward it, don't close yet
                continue;
              }

              // Extract thread ID
              const match = /\[THREAD_ID:(.*?)\]/.exec(data);
              if (match && !threadId) {
                threadId = match[1].trim();
                if (!threadIdSet) {
                  try {
                    await updateThreadWithKyvexId(apiKeyId, conversationId, threadId);
                    threadIdSet = true;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ conversation_id: conversationId })}\n\n`)
                    );
                  } catch (err) {
                    console.error('Error updating thread:', err);
                  }
                }
              }

              // Remove thread ID marker and reasoning tags
              let content = data
                .replace(/\[THREAD_ID:.*?\]/g, '')
                .replace(/<think>.*?<\/redacted_reasoning>/g, '')
                .replace(/<think>.*?<\/think>/g, '') // Also remove think tags
                .trim();

              if (content) {
                fullStreamContent += content;
                
                // Check for rate limit (will be handled by cookie pool auto-rotation)
                if (!rateLimitDetected && detectRateLimit(content)) {
                  rateLimitDetected = true;
                  console.log('[Stream] Rate limit detected in response');
                }
                
                // Replace URLs and brand name in content
                const replacedContent = replaceKyvexBrand(replaceKyvexUrls(content));
                
                // Only send non-empty content chunks
                if (replacedContent) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                      id: chatId,
                      object: 'chat.completion.chunk',
                      created,
                      model: customModel,
                      choices: [{
                        index: 0,
                        delta: { content: replacedContent },
                        finish_reason: null,
                      }],
                    })}\n\n`)
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
        if (!isClosed) {
          try {
            controller.error(error);
          } catch (e) {
            // Controller may already be closed
          }
        }
      } finally {
        isClosed = true;
        try {
          reader.releaseLock();
        } catch (e) {
          // Reader may already be released
        }
        try {
          controller.close();
        } catch (e) {
          // Controller may already be closed
        }
      }
    },
    cancel() {
      isClosed = true;
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
