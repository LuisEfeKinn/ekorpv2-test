// ----------------------------------------------------------------------
// useAiStreamingDynamic Hook - Streaming AI responses with dynamic config
// Simplified structure - uses provider name instead of key
// ----------------------------------------------------------------------

import type { IAiChatMessage } from 'src/types/ai-course-generation';
import type { IAiProvider, IAiProviderModel } from 'src/types/ai-provider';

import { useRef, useState, useCallback } from 'react';

import { getLegacyTypeFromName, getApiRouteForProvider } from './useAiProvidersDynamic';

// ----------------------------------------------------------------------

/**
 * Get auth token from sessionStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken') || sessionStorage.getItem('jwt_access_token');
}

// ----------------------------------------------------------------------

interface StreamingState {
  isStreaming: boolean;
  currentChunk: string;
  fullResponse: string;
  error: string | null;
}

interface UseAiStreamingDynamicOptions {
  onChunk?: (content: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: string) => void;
}

export interface IAiStreamConfig {
  provider: IAiProvider;
  model: IAiProviderModel;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// ----------------------------------------------------------------------

export function useAiStreamingDynamic(options?: UseAiStreamingDynamicOptions) {
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
    async (messages: IAiChatMessage[], config: IAiStreamConfig): Promise<string> => {
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
        const { provider, model, temperature, maxTokens, topP, frequencyPenalty, presencePenalty } =
          config;

        // Get the API endpoint based on provider name
        const endpoint = `${getApiRouteForProvider(provider.name)}/chat`;
        const legacyType = getLegacyTypeFromName(provider.name);

        // Format messages for API
        const formattedMessages = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        let requestBody: any = {
          messages: formattedMessages,
          model: model.modelKey,
          stream: true,
          // Pass provider info for the API route to use
          providerName: provider.name,
          providerId: provider.id,
          modelId: model.id,
        };

        // Provider-specific configurations
        if (legacyType === 'gemini') {
          // Gemini uses different format
          requestBody = {
            contents: formattedMessages.map((msg) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            })),
            generationConfig: {
              temperature: temperature ?? 0.7,
              maxOutputTokens: maxTokens ?? model.maxTokens ?? 4096,
              topP,
            },
            model: model.modelKey,
            providerName: provider.name,
            providerId: provider.id,
            modelId: model.id,
          };
        } else if (legacyType === 'openai') {
          // OpenAI newer models use max_completion_tokens
          requestBody.max_completion_tokens = maxTokens ?? model.maxTokens ?? 4096;
          // Only set temperature if explicitly 1, otherwise omit it
          if (temperature === 1) {
            requestBody.temperature = 1;
          }
          requestBody.top_p = topP;
          requestBody.frequency_penalty = frequencyPenalty;
          requestBody.presence_penalty = presencePenalty;
        } else if (legacyType === 'minimax') {
          // MiniMax supports up to 8192 tokens
          requestBody.max_tokens = maxTokens ?? model.maxTokens ?? 8192;
          requestBody.temperature = temperature ?? 0.7;
        } else {
          // Default format
          requestBody.max_tokens = maxTokens ?? model.maxTokens ?? 4096;
          requestBody.temperature = temperature ?? 0.7;
          requestBody.top_p = topP;
          requestBody.frequency_penalty = frequencyPenalty;
          requestBody.presence_penalty = presencePenalty;
        }

        // Build headers with auth token
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        const authToken = getAuthToken();
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        // Use fetch for streaming support
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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

                if (legacyType === 'gemini') {
                  content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else if (legacyType === 'minimax') {
                  // Skip if stream finished
                  if (parsed.choices?.[0]?.finish_reason === 'stop') {
                    continue;
                  }
                  content = parsed.choices?.[0]?.delta?.content || '';
                } else {
                  // OpenAI format
                  content =
                    parsed.choices?.[0]?.delta?.content || parsed.text || parsed.content || '';
                }

                if (content) {
                  accumulated += content;
                  accumulatedTextRef.current = accumulated;

                  setState((prev) => ({
                    ...prev,
                    currentChunk: content,
                    fullResponse: accumulated,
                  }));

                  options?.onChunk?.(content);
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
    async (messages: IAiChatMessage[], config: IAiStreamConfig): Promise<string> => {
      setState((prev) => ({
        ...prev,
        isStreaming: true,
        error: null,
      }));

      try {
        const { provider, model, temperature, maxTokens } = config;

        const endpoint = `${getApiRouteForProvider(provider.name)}/chat`;
        const legacyType = getLegacyTypeFromName(provider.name);

        const formattedMessages = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        let requestBody: any = {
          messages: formattedMessages,
          model: model.modelKey,
          stream: false,
          providerName: provider.name,
          providerId: provider.id,
          modelId: model.id,
        };

        if (legacyType === 'openai') {
          requestBody.max_completion_tokens = maxTokens ?? model.maxTokens ?? 4096;
          if (temperature === 1) {
            requestBody.temperature = 1;
          }
        } else if (legacyType === 'gemini') {
          requestBody = {
            contents: formattedMessages.map((msg) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            })),
            generationConfig: {
              temperature: temperature ?? 0.7,
              maxOutputTokens: maxTokens ?? model.maxTokens ?? 4096,
            },
            model: model.modelKey,
            providerName: provider.name,
            providerId: provider.id,
            modelId: model.id,
          };
        } else {
          requestBody.max_tokens = maxTokens ?? model.maxTokens ?? 4096;
          requestBody.temperature = temperature ?? 0.7;
        }

        // Build headers with auth token
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        const authToken = getAuthToken();
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        let content = '';

        if (legacyType === 'gemini') {
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
