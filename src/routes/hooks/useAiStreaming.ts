// ----------------------------------------------------------------------
// useAiStreaming Hook - Streaming AI responses by chunks
// ----------------------------------------------------------------------

import type { AiProviderType } from 'src/types/ai-course';
import type {
  IAiStreamChunk,
  IAiChatMessage,
  IAiGenerationConfig,
} from 'src/types/ai-course-generation';

import { useRef, useState, useCallback } from 'react';

// ----------------------------------------------------------------------

interface StreamingState {
  isStreaming: boolean;
  currentChunk: string;
  fullResponse: string;
  error: string | null;
}

interface UseAiStreamingOptions {
  onChunk?: (chunk: IAiStreamChunk) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: string) => void;
}

// ----------------------------------------------------------------------

// API endpoints for different providers (via Next.js API routes)
const PROVIDER_CONFIG: Record<AiProviderType, { endpoint: string }> = {
  openai: {
    endpoint: '/api/ai/openai/chat',
  },
  gemini: {
    endpoint: '/api/ai/gemini/chat',
  },
  deepseek: {
    endpoint: '/api/ai/deepseek/chat',
  },
  minimax: {
    endpoint: '/api/ai/minimax/chat',
  },
  proprietary: {
    endpoint: '/api/ai/proprietary/chat',
  },
};

// ----------------------------------------------------------------------

export function useAiStreaming(options?: UseAiStreamingOptions) {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentChunk: '',
    fullResponse: '',
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedTextRef = useRef<string>('');

  // Start streaming
  const startStream = useCallback(
    async (
      messages: IAiChatMessage[],
      config: IAiGenerationConfig
    ): Promise<string> => {
      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      accumulatedTextRef.current = '';

      setState({
        isStreaming: true,
        currentChunk: '',
        fullResponse: '',
        error: null,
      });

      try {
        const providerConfig = PROVIDER_CONFIG[config.provider];
        const endpoint = providerConfig.endpoint;

        // Format messages for API
        const formattedMessages = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        let requestBody: any = {
          messages: formattedMessages,
          model: config.model,
          stream: true,
        };

        // OpenAI newer models use max_completion_tokens instead of max_tokens
        // and some models only support temperature = 1 (default)
        if (config.provider === 'openai') {
          requestBody.max_completion_tokens = config.maxTokens ?? 4096;
          // Only set temperature if explicitly 1, otherwise omit it
          if (config.temperature === 1) {
            requestBody.temperature = 1;
          }
        } else if (config.provider === 'minimax') {
          // MiniMax supports up to 8192 tokens
          requestBody.max_tokens = config.maxTokens ?? 8192;
          requestBody.temperature = config.temperature ?? 0.7;
        } else {
          requestBody.max_tokens = config.maxTokens ?? 4096;
          requestBody.temperature = config.temperature ?? 0.7;
        }

        // Provider-specific configurations
        if (config.provider === 'gemini') {
          // Gemini uses different format
          requestBody = {
            contents: formattedMessages.map((msg) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            })),
            generationConfig: {
              temperature: config.temperature ?? 0.7,
              maxOutputTokens: config.maxTokens ?? 4096,
              topP: config.topP,
            },
            model: config.model,
          };
        } else {
          // OpenAI, DeepSeek, Minimax format
          requestBody.top_p = config.topP;
          requestBody.frequency_penalty = config.frequencyPenalty;
          requestBody.presence_penalty = config.presencePenalty;
        }

        // Use fetch for streaming support
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const text = decoder.decode(value, { stream: true });

          // Parse SSE events
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                let content = '';

                if (config.provider === 'gemini') {
                  content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else if (config.provider === 'minimax') {
                  // MiniMax streaming format
                  // Skip if stream finished
                  if (parsed.choices?.[0]?.finish_reason === 'stop') {
                    continue;
                  }

                  // Extract content from MiniMax format (same as OpenAI)
                  content = parsed.choices?.[0]?.delta?.content || '';
                } else {
                  // OpenAI, DeepSeek format
                  content = parsed.choices?.[0]?.delta?.content ||
                    parsed.text ||
                    parsed.content || '';
                }

                if (content) {
                  accumulated += content;
                  accumulatedTextRef.current = accumulated;

                  const chunk: IAiStreamChunk = {
                    type: 'text',
                    content,
                  };

                  setState((prev) => ({
                    ...prev,
                    currentChunk: content,
                    fullResponse: accumulated,
                  }));

                  options?.onChunk?.(chunk);
                }
              } catch {
                // Ignore parse errors for incomplete JSON
              }
            }
          }
        }

        const finalResponse = accumulatedTextRef.current;

        setState((prev) => ({
          ...prev,
          isStreaming: false,
        }));

        options?.onComplete?.(finalResponse);

        return finalResponse;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
          }));
          return accumulatedTextRef.current;
        }

        const errorMessage = error.message || 'Streaming failed';

        setState({
          isStreaming: false,
          currentChunk: '',
          fullResponse: accumulatedTextRef.current,
          error: errorMessage,
        });

        options?.onError?.(errorMessage);
        throw error;
      }
    },
    [options]
  );

  // Stop streaming
  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

  // Clear state
  const clearStream = useCallback(() => {
    stopStream();
    accumulatedTextRef.current = '';
    setState({
      isStreaming: false,
      currentChunk: '',
      fullResponse: '',
      error: null,
    });
  }, [stopStream]);

  // Non-streaming request (fallback)
  const sendMessage = useCallback(
    async (
      messages: IAiChatMessage[],
      config: IAiGenerationConfig
    ): Promise<string> => {
      setState((prev) => ({
        ...prev,
        isStreaming: true,
        error: null,
      }));

      try {
        const providerConfig = PROVIDER_CONFIG[config.provider];
        const endpoint = providerConfig.endpoint;

        const formattedMessages = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        let requestBody: any = {
          messages: formattedMessages,
          model: config.model,
          stream: false,
        };

        // OpenAI newer models use max_completion_tokens instead of max_tokens
        // and some models only support temperature = 1 (default)
        if (config.provider === 'openai') {
          requestBody.max_completion_tokens = config.maxTokens ?? 4096;
          // Only set temperature if explicitly 1, otherwise omit it
          if (config.temperature === 1) {
            requestBody.temperature = 1;
          }
        } else {
          requestBody.max_tokens = config.maxTokens ?? 4096;
          requestBody.temperature = config.temperature ?? 0.7;
        }

        // Provider-specific configurations
        if (config.provider === 'gemini') {
          requestBody = {
            contents: formattedMessages.map((msg) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            })),
            generationConfig: {
              temperature: config.temperature ?? 0.7,
              maxOutputTokens: config.maxTokens ?? 4096,
            },
            model: config.model,
          };
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        let content = '';

        if (config.provider === 'gemini') {
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          content = data.choices?.[0]?.message?.content || data.text || data.content || '';
        }

        setState({
          isStreaming: false,
          currentChunk: '',
          fullResponse: content,
          error: null,
        });

        options?.onComplete?.(content);

        return content;
      } catch (error: any) {
        const errorMessage = error.message || 'Request failed';

        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: errorMessage,
        }));

        options?.onError?.(errorMessage);
        throw error;
      }
    },
    [options]
  );

  return {
    // State
    isStreaming: state.isStreaming,
    currentChunk: state.currentChunk,
    fullResponse: state.fullResponse,
    error: state.error,

    // Actions
    startStream,
    stopStream,
    clearStream,
    sendMessage,
  };
}
