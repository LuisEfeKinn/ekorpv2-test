'use client';

// ----------------------------------------------------------------------
// Learning Path Chat Panel Component
// Step 1: User describes the learning path they want,
// AI generates an instruction JSON with programs and courses
// ----------------------------------------------------------------------

import type { ILPProviderConfig, ILPInstructionJSON } from 'src/types/ai-learning-path';
import type { IAiChatMessage, IAiGenerationPrompt } from 'src/types/ai-course-generation';

import rehypeRaw from 'rehype-raw';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useAiStreamingDynamic } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { LEARNING_PATH_INSTRUCTION_SYSTEM_PROMPT } from './lp-constants';

// ----------------------------------------------------------------------

type Props = {
  providerConfig: ILPProviderConfig;
  onInstructionGenerated?: (instruction: ILPInstructionJSON) => void;
  onError?: (error: string) => void;
  onGenerationStart?: () => void;
};

// ----------------------------------------------------------------------

export function LPChatPanel({ providerConfig, onInstructionGenerated, onError, onGenerationStart }: Props) {
  const { t } = useTranslate('ai');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<IAiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');

  const {
    isStreaming,
    fullResponse,
    error,
    startStream,
    stopStream,
    clearStream,
  } = useAiStreamingDynamic({
    onComplete: async (response) => {
      // Add assistant message when streaming completes
      const assistantMessage: IAiChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Try to extract instruction JSON from response
      try {
        const instructionData = extractInstructionData(response);
        if (instructionData) {
          onInstructionGenerated?.(instructionData);
        } else {
          onError?.(t('ai-learning-path.chat.errors.extractStructure'));
        }
      } catch (e) {
        console.error('Failed to extract instruction data:', e);
        onError?.(
          `${t('ai-learning-path.chat.errors.processResponse')}: ${
            e instanceof Error ? e.message : t('ai-learning-path.errors.unknown')
          }`
        );
      }
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, fullResponse]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isStreaming) return;

    onGenerationStart?.();

    const userMessage: IAiChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Prepare messages for API
    const apiMessages: IAiChatMessage[] = [
      {
        id: 'system',
        role: 'system',
        content: LEARNING_PATH_INSTRUCTION_SYSTEM_PROMPT,
        timestamp: new Date().toISOString(),
      },
      ...messages,
      userMessage,
    ];

    if (!providerConfig.textProvider || !providerConfig.textModel) {
      onError?.(t('ai-learning-path.errors.noProviderModelSelected'));
      return;
    }

    await startStream(apiMessages, {
      provider: providerConfig.textProvider,
      model: providerConfig.textModel,
      temperature: providerConfig.temperature,
    });
  }, [inputValue, isStreaming, messages, startStream, providerConfig, onError, onGenerationStart, t]);

  // Handle Enter key
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([]);
    clearStream();
  };

  // Parse assistant messages to detect instruction JSON for visual preview
  const parsedMessages = useMemo(
    () =>
      messages.map((msg) => {
        if (msg.role !== 'assistant') return { msg, instructionJSON: null, textBefore: '' };
        const parsed = tryParseInstructionFromMessage(msg.content);
        return { msg, ...parsed };
      }),
    [messages]
  );

  // Quick prompts
  const quickPrompts: IAiGenerationPrompt[] = [
    {
      topic: t('ai-learning-path.chat.quickPrompts.webDev.title'),
      description: t('ai-learning-path.chat.quickPrompts.webDev.description'),
      difficulty: 'beginner',
    },
    {
      topic: t('ai-learning-path.chat.quickPrompts.dataAi.title'),
      description: t('ai-learning-path.chat.quickPrompts.dataAi.description'),
      difficulty: 'intermediate',
    },
    {
      topic: t('ai-learning-path.chat.quickPrompts.leadership.title'),
      description: t('ai-learning-path.chat.quickPrompts.leadership.description'),
      difficulty: 'advanced',
    },
  ];

  const handleQuickPrompt = (prompt: IAiGenerationPrompt) => {
    setInputValue(
      t('ai-learning-path.chat.quickPromptTemplate', {
        topic: prompt.topic,
        description: prompt.description || '',
      })
    );
  };

  return (
    <Stack spacing={0}>
      {/* Header */}
      <Card>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <Iconify icon="tabler:robot" width={20} />
            </Avatar>
            <Typography variant="subtitle1">
              {t('ai-learning-path.chat.title')}
            </Typography>
          </Stack>

          <IconButton size="small" onClick={handleClearChat} disabled={isStreaming}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Stack>
      </Card>

      {/* Messages Area */}
      <Card
        ref={scrollRef}
        sx={{
          mt: 1,
          p: 2,
          flexGrow: 1,
          overflow: 'auto',
          maxHeight: 500,
          minHeight: 350,
        }}
      >
        {messages.length === 0 && !isStreaming ? (
          <Stack
            spacing={3}
            alignItems="center"
            justifyContent="center"
            sx={{ height: '100%', py: 4 }}
          >
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.lighter' }}>
              <Iconify icon="solar:point-on-map-perspective-bold" width={36} color="primary.main" />
            </Avatar>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                {t('ai-learning-path.chat.welcomeTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
                {t('ai-learning-path.chat.welcomeMessage')}
              </Typography>
            </Box>

            {/* Quick Prompts */}
            <Stack spacing={1} sx={{ width: '100%', maxWidth: 500 }}>
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => handleQuickPrompt(prompt)}
                  startIcon={<Iconify icon="solar:forward-bold" />}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    textTransform: 'none',
                  }}
                >
                  {prompt.topic}
                </Button>
              ))}
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2}>
            {parsedMessages.map(({ msg: message, instructionJSON: parsedInstruction, textBefore }) => (
              <Stack
                key={message.id}
                direction="row"
                spacing={1.5}
                sx={{
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', flexShrink: 0 }}>
                    <Iconify icon="tabler:robot" width={16} />
                  </Avatar>
                )}

                {/* User message */}
                {message.role === 'user' && (
                  <Card
                    sx={{
                      p: 1.5,
                      maxWidth: '80%',
                      bgcolor: 'primary.lighter',
                    }}
                  >
                    <Typography variant="body2">{message.content}</Typography>
                  </Card>
                )}

                {/* Assistant message with instruction preview */}
                {message.role === 'assistant' && parsedInstruction && (
                  <Box sx={{ maxWidth: '85%', width: '100%' }}>
                    {textBefore && (
                      <Card sx={{ p: 1.5, mb: 1, bgcolor: 'grey.100' }}>
                        <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                          {textBefore}
                        </ReactMarkdown>
                      </Card>
                    )}
                    <InstructionPreview instruction={parsedInstruction} t={t} />
                  </Box>
                )}

                {/* Assistant message without instruction (regular markdown) */}
                {message.role === 'assistant' && !parsedInstruction && (
                  <Card
                    sx={{
                      p: 1.5,
                      maxWidth: '80%',
                      bgcolor: 'grey.100',
                      '& pre': {
                        bgcolor: 'grey.900',
                        color: 'common.white',
                        p: 1.5,
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.8rem',
                      },
                      '& code': { fontSize: '0.8rem' },
                    }}
                  >
                    <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                      {message.content}
                    </ReactMarkdown>
                  </Card>
                )}

                {message.role === 'user' && (
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', flexShrink: 0 }}>
                    <Iconify icon="solar:user-rounded-bold" width={16} />
                  </Avatar>
                )}
              </Stack>
            ))}

            {/* Streaming Response */}
            {isStreaming && fullResponse && (
              <Stack direction="row" spacing={1.5}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', flexShrink: 0 }}>
                  <Iconify icon="tabler:robot" width={16} />
                </Avatar>
                <Card
                  sx={{
                    p: 1.5,
                    maxWidth: '80%',
                    bgcolor: 'grey.100',
                    '& pre': {
                      bgcolor: 'grey.900',
                      color: 'common.white',
                      p: 1.5,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.8rem',
                    },
                  }}
                >
                  <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                    {fullResponse}
                  </ReactMarkdown>
                </Card>
              </Stack>
            )}

            {/* Streaming indicator */}
            {isStreaming && !fullResponse && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', flexShrink: 0 }}>
                  <Iconify icon="tabler:robot" width={16} />
                </Avatar>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  {t('ai-learning-path.chat.generatingStructure')}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
      </Card>

      {/* Input Area */}
      <Card sx={{ mt: 1, p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            size="small"
            placeholder={t('ai-learning-path.chat.inputPlaceholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isStreaming}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {isStreaming ? (
                    <IconButton size="small" onClick={stopStream} color="error">
                      <Iconify icon="solar:stop-circle-bold" />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      color="primary"
                    >
                      <Iconify icon="solar:letter-bold" />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 1 }} onClose={() => {}}>
            {error}
          </Alert>
        )}
      </Card>
    </Stack>
  );
}

// ----------------------------------------------------------------------
// Helper: Extract instruction JSON from AI response
// ----------------------------------------------------------------------

function extractInstructionData(response: string): ILPInstructionJSON | null {
  try {
    let jsonText = response;

    // Try to find JSON in code blocks
    const jsonCodeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonCodeBlockMatch) {
      jsonText = jsonCodeBlockMatch[1];
    } else {
      // Try plain code blocks
      const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      }
    }

    jsonText = jsonText.trim();

    // Try to parse
    if (jsonText.startsWith('{') || jsonText.startsWith('[')) {
      const parsed = JSON.parse(jsonText);

      // Validate structure
      if (parsed.learning_path && parsed.learning_path.programs) {
        return validateInstructionJSON(parsed);
      }

      // Maybe the AI returned without the root wrapper
      if (parsed.instruction_lp && parsed.programs) {
        return validateInstructionJSON({ learning_path: parsed });
      }
    }

    // Try to find a JSON object anywhere in the response
    const objectMatch = response.match(/\{[\s\S]*?"learning_path"[\s\S]*?\}/);
    if (objectMatch) {
      const parsed = JSON.parse(objectMatch[0]);
      if (parsed.learning_path) {
        return validateInstructionJSON(parsed);
      }
    }

    return null;
  } catch (e) {
    console.error('Failed to extract instruction data:', e);
    return null;
  }
}

function validateInstructionJSON(data: any): ILPInstructionJSON | null {
  const lp = data.learning_path;
  if (!lp || !lp.instruction_lp || !Array.isArray(lp.programs)) return null;

  // Validate each program has courses
  for (const program of lp.programs) {
    if (!program.instruction_pg || !Array.isArray(program.courses)) return null;
    for (const course of program.courses) {
      if (!course.instruction_c) return null;
    }
  }

  return data as ILPInstructionJSON;
}

// ----------------------------------------------------------------------
// Helper: Parse instruction JSON from an assistant message
// Returns the instruction JSON and any text before the JSON block.
// ----------------------------------------------------------------------

function tryParseInstructionFromMessage(content: string): {
  instructionJSON: ILPInstructionJSON | null;
  textBefore: string;
} {
  // Try ```json ... ``` blocks first
  const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim());
      const validated =
        parsed.learning_path && parsed.learning_path.programs
          ? validateInstructionJSON(parsed)
          : parsed.instruction_lp && parsed.programs
            ? validateInstructionJSON({ learning_path: parsed })
            : null;

      if (validated) {
        const idx = content.indexOf('```json');
        const textBefore = content.slice(0, idx).trim();
        return { instructionJSON: validated, textBefore };
      }
    } catch {
      // Not valid JSON
    }
  }

  // Try plain ``` ... ``` blocks
  const codeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      const validated =
        parsed.learning_path && parsed.learning_path.programs
          ? validateInstructionJSON(parsed)
          : null;

      if (validated) {
        const idx = content.indexOf('```');
        const textBefore = content.slice(0, idx).trim();
        return { instructionJSON: validated, textBefore };
      }
    } catch {
      // Not valid JSON
    }
  }

  return { instructionJSON: null, textBefore: '' };
}

// ----------------------------------------------------------------------
// Visual preview component for the instruction JSON
// ----------------------------------------------------------------------

function InstructionPreview({
  instruction,
  t,
}: {
  instruction: ILPInstructionJSON;
  t: (key: string, options?: any) => string;
}) {
  const lp = instruction.learning_path;
  const totalCourses = lp.programs.reduce((acc, p) => acc + p.courses.length, 0);

  return (
    <Card
      sx={{
        p: 0,
        overflow: 'hidden',
        border: (theme) => `1px solid ${theme.palette.primary.light}`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'common.white',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Iconify icon="solar:point-on-map-perspective-bold" width={28} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {t('ai-learning-path.chat.preview.title')}
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: 0.85, mt: 0.25 }}
              noWrap
            >
              {lp.instruction_lp}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Chip
            size="small"
            label={t('ai-learning-path.chat.preview.programsCount', { count: lp.programs.length })}
            icon={<Iconify icon="solar:case-minimalistic-bold" width={14} />}
            sx={{
              bgcolor: 'rgba(255,255,255,0.18)',
              color: 'common.white',
              fontWeight: 600,
              fontSize: '0.75rem',
              '& .MuiChip-icon': { color: 'common.white' },
            }}
          />
          <Chip
            size="small"
            label={t('ai-learning-path.chat.preview.coursesCount', { count: totalCourses })}
            icon={<Iconify icon="solar:book-bold" width={14} />}
            sx={{
              bgcolor: 'rgba(255,255,255,0.18)',
              color: 'common.white',
              fontWeight: 600,
              fontSize: '0.75rem',
              '& .MuiChip-icon': { color: 'common.white' },
            }}
          />
        </Stack>
      </Box>

      {/* Programs */}
      <Stack sx={{ p: 2 }} spacing={1.5}>
        {lp.programs.map((program, pIdx) => (
          <Card
            key={pIdx}
            variant="outlined"
            sx={{
              p: 0,
              overflow: 'hidden',
              borderColor: 'divider',
            }}
          >
            {/* Program header */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                px: 2,
                py: 1.25,
                bgcolor: (theme) => theme.palette.grey[50],
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Chip
                label={`P${pIdx + 1}`}
                size="small"
                color="primary"
                sx={{ fontWeight: 700, minWidth: 36 }}
              />
              <Typography variant="subtitle2" sx={{ flex: 1, minWidth: 0 }}>
                {program.instruction_pg}
              </Typography>
              <Chip
                size="small"
                label={`${program.courses.length}`}
                icon={<Iconify icon="solar:book-bold" width={12} />}
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Stack>

            {/* Courses */}
            <Stack sx={{ px: 2, py: 1 }} spacing={0.5}>
              {program.courses.map((course, cIdx) => (
                <Stack
                  key={cIdx}
                  direction="row"
                  alignItems="flex-start"
                  spacing={1}
                  sx={{ py: 0.5 }}
                >
                  <Iconify
                    icon="solar:book-bold"
                    width={16}
                    sx={{
                      mt: 0.25,
                      flexShrink: 0,
                      color: 'primary.main',
                      opacity: 0.7,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {course.instruction_c}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        ))}
      </Stack>

      {/* Footer */}
      <Box
        sx={{
          px: 2.5,
          py: 1.25,
          bgcolor: (theme) => theme.palette.success.lighter,
          borderTop: (theme) => `1px solid ${theme.palette.success.light}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:check-circle-bold" width={18} color="success.main" />
          <Typography variant="caption" fontWeight={600} color="success.dark">
            {t('ai-learning-path.chat.preview.readyMessage')}
          </Typography>
        </Stack>
      </Box>
    </Card>
  );
}
