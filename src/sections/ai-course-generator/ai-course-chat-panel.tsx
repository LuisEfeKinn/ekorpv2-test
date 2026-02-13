'use client';

// ----------------------------------------------------------------------
// AI Course Chat Panel Component
// Streaming chat interface for AI course generation
// Uses dynamic provider configuration from backend
// ----------------------------------------------------------------------

import type { IAiProvider, IAiProviderModel } from 'src/types/ai-provider';
import type { IAiChatMessage, IAiGenerationPrompt } from 'src/types/ai-course-generation';

import rehypeRaw from 'rehype-raw';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useAiProvidersDynamic, useAiStreamingDynamic } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GenerateCourseImagesService } from 'src/services/ai/GenerateAiImage.service';

import { Iconify } from 'src/components/iconify';

import { parseCapabilities } from 'src/types/ai-provider';
import { COURSE_GENERATION_SYSTEM_PROMPT } from 'src/types/ai-course-generation';

// ----------------------------------------------------------------------

type Props = {
  onCourseGenerated?: (courseData: any, credits?: { consumed: number; remaining: number }) => void;
  onError?: (error: string) => void;
  onGenerationStart?: () => void;
};

// ----------------------------------------------------------------------

const PROPRIETARY_IMAGE_MODEL_OPTIONS = [
  { label: 'Google', value: 'Google' },
  { label: 'OpenAI', value: 'OpenAI' },
];

// ----------------------------------------------------------------------

export function AiCourseChatPanel({ onCourseGenerated, onError, onGenerationStart }: Props) {
  const { t } = useTranslate('ai-course');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<IAiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0 });
  const [videoProgress, setVideoProgress] = useState({ current: 0, total: 0 });
  const [proprietaryVideoStatus, setProprietaryVideoStatus] = useState<string>('');

  // Selected providers and models for media generation (by ID)
  const [selectedImageProviderId, setSelectedImageProviderId] = useState<string>('');
  const [selectedImageModelId, setSelectedImageModelId] = useState<string>('');
  const [selectedVideoProviderId, setSelectedVideoProviderId] = useState<string>('');
  const [selectedVideoModelId, setSelectedVideoModelId] = useState<string>('');

  // Proprietary video model options
  const [proprietaryDurationScenes, setProprietaryDurationScenes] = useState<number>(4);
  const [proprietaryScenesNumber, setProprietaryScenesNumber] = useState<number>(5);
  const [proprietaryImageModel, setProprietaryImageModel] = useState<string>(
    PROPRIETARY_IMAGE_MODEL_OPTIONS[0]?.value || ''
  );

  // Use dynamic providers from backend
  const {
    isLoading: isLoadingProviders,
    error: providersError,
    textProviders,
    imageProviders,
    videoProviders,
    selectedProvider,
    selectedModel,
    availableModels,
    temperature,
    selectProvider,
    selectModel,
    setTemperature,
    getLegacyProviderType,
  } = useAiProvidersDynamic({ capability: 'text' });

// Helper function to find the provider and model with isDefault=true
  const findDefaultProviderAndModel = useCallback(
    (providers: IAiProvider[], capability: 'text' | 'image' | 'video'): { provider: IAiProvider; model: IAiProviderModel } | null => {
      // Search through all providers to find one with a default model
      for (const provider of providers) {
        const modelsWithCapability = provider.models.filter((model) => {
          const caps = parseCapabilities(model.capabilities);
          return caps.includes(capability);
        });
        
        // Look for a model marked as default
        const defaultModel = modelsWithCapability.find((m) => m.isDefault);
        if (defaultModel) {
          return { provider, model: defaultModel };
        }
      }
      
      // If no default found, return first provider and its first model
      if (providers.length > 0) {
        const firstProvider = providers[0];
        const modelsWithCapability = firstProvider.models.filter((model) => {
          const caps = parseCapabilities(model.capabilities);
          return caps.includes(capability);
        });
        
        if (modelsWithCapability.length > 0) {
          return { provider: firstProvider, model: modelsWithCapability[0] };
        }
      }
      
      return null;
    },
    []
  );

  // Helper function to get default model from a provider based on isDefault flag and capability
  const getDefaultModel = useCallback(
    (provider: IAiProvider | undefined, capability: 'text' | 'image' | 'video'): IAiProviderModel | undefined => {
      if (!provider) return undefined;

      // Filter models by capability
      const modelsWithCapability = provider.models.filter((model) => {
        const caps = parseCapabilities(model.capabilities);
        return caps.includes(capability);
      });

      // Find the default model
      const defaultModel = modelsWithCapability.find((m) => m.isDefault);
      return defaultModel || modelsWithCapability[0];
    },
    []
  );

  // Get selected image and video providers
  const selectedImageProvider = imageProviders.find((p) => p.id === selectedImageProviderId);
  const selectedVideoProvider = videoProviders.find((p) => p.id === selectedVideoProviderId);

  // Get available models filtered by capability
  const availableImageModels = useMemo(() => {
    if (!selectedImageProvider) return [];
    return selectedImageProvider.models.filter((model) => {
      const caps = parseCapabilities(model.capabilities);
      return caps.includes('image');
    });
  }, [selectedImageProvider]);

  const availableVideoModels = useMemo(() => {
    if (!selectedVideoProvider) return [];
    return selectedVideoProvider.models.filter((model) => {
      const caps = parseCapabilities(model.capabilities);
      return caps.includes('video');
    });
  }, [selectedVideoProvider]);

  // Get selected models
  const selectedImageModel = availableImageModels.find((m) => m.id === selectedImageModelId);
  // const selectedVideoModel = availableVideoModels.find((m) => m.id === selectedVideoModelId);

  // Set default image/video providers and models when loaded
  useEffect(() => {
    if (imageProviders.length > 0 && !selectedImageProviderId) {
      // Find provider with default model across all image providers
      const defaultConfig = findDefaultProviderAndModel(imageProviders, 'image');
      
      if (defaultConfig) {
        setSelectedImageProviderId(defaultConfig.provider.id);
        setSelectedImageModelId(defaultConfig.model.id);
      }
    }
  }, [imageProviders, selectedImageProviderId, findDefaultProviderAndModel]);

  useEffect(() => {
    if (videoProviders.length > 0 && !selectedVideoProviderId) {
      // Find provider with default model across all video providers
      const defaultConfig = findDefaultProviderAndModel(videoProviders, 'video');
      
      if (defaultConfig) {
        setSelectedVideoProviderId(defaultConfig.provider.id);
        setSelectedVideoModelId(defaultConfig.model.id);
      }
    }
  }, [videoProviders, selectedVideoProviderId, findDefaultProviderAndModel]);

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

      // Try to extract course data from response
      try {
        const courseData = extractCourseData(response);
        if (courseData) {
          // Normalize sections to ensure ALL have the required media fields
          let updatedSections = (courseData.sections || []).map((section: any) => ({
            ...section,
            // Ensure all media-related fields exist, even if empty
            image: section.image || '',
            video: section.video || '',
            needsImage: section.needsImage ?? false,
            needsVideo: section.needsVideo ?? false,
            images: section.images || [],
            videos: section.videos || [],
          }));

          let updatedBannerUrl = courseData.bannerUrl;

          // Generate banner image if banner exists
          if (courseData.banner && selectedImageProvider && selectedImageModel) {
            setIsGeneratingBanner(true);
            try {
              const { GenerateAndUploadAiImageService } = await import('src/services/ai/GenerateAiImage.service');

              const bannerResult = await GenerateAndUploadAiImageService({
                prompt: courseData.banner,
                size: '1536x1024', // Landscape aspect ratio (supported by DALL-E)
                provider: getLegacyProviderType(selectedImageProvider), // Use selected image provider
                model: selectedImageModel.modelKey, // Use selected model
              });

              if (bannerResult?.imageUrl) {
                updatedBannerUrl = bannerResult.imageUrl;
              }
            } catch (bannerError) {
              console.error('Failed to generate banner:', bannerError);
            } finally {
              setIsGeneratingBanner(false);
            }
          }

          // Check if image generation is requested
          // Generate for ALL sections that have an image prompt, not just those marked needsImage
          const sectionsNeedingImages = updatedSections.filter((s: any) => s.image && s.image.trim());
          if (courseData.generateImages && sectionsNeedingImages.length > 0 && selectedImageProvider && selectedImageModel) {
            setIsGeneratingImages(true);
            setImageProgress({ current: 0, total: sectionsNeedingImages.length });

            try {
              // Generate images only for sections that need them
              const imageResults = await GenerateCourseImagesService(
                courseData.title,
                sectionsNeedingImages,
                {
                  provider: getLegacyProviderType(selectedImageProvider), // Use selected image provider
                  model: selectedImageModel.modelKey, // Use selected model
                  onProgress: (current: number, total: number) => {
                    setImageProgress({ current, total });
                  },
                }
              );

              // Update sections with image URLs in arrays
              updatedSections = updatedSections.map((section: any) => {
                // Skip if section doesn't have an image prompt
                if (!section.image || !section.image.trim()) return section;

                const sectionIndex = sectionsNeedingImages.findIndex((s: any) => s.title === section.title);
                const imageResult = imageResults.find((result) => result.sectionIndex === sectionIndex);

                // Initialize arrays if they don't exist
                const images = section.images || [];
                const blocks = section.blocks || [];

                // Add new image to the array if generation was successful
                if (imageResult?.imageUrl) {
                  images.push({
                    url: imageResult.imageUrl,
                  });

                  // Add image block for preview rendering
                  blocks.push({
                    id: `${section.id}-image-${Date.now()}`,
                    type: 'image',
                    order: blocks.length,
                    content: {
                      url: imageResult.imageUrl,
                      altText: section.image || section.title,
                      caption: section.image,
                    },
                  });
                }

                return {
                  ...section,
                  images,
                  blocks,
                  // Keep ALL original fields including image, video, needsImage, needsVideo
                  // Keep legacy fields for backward compatibility
                  imageUrl: imageResult?.imageUrl,
                };
              });
            } catch (imageError) {
              console.error('Failed to generate images:', imageError);
              onError?.(`Error generating images: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
            } finally {
              setIsGeneratingImages(false);
              setImageProgress({ current: 0, total: 0 });
            }
          }

          // Check if video generation is requested
          // Generate for ALL sections that have a video prompt, not just those marked needsVideo
          const sectionsNeedingVideos = updatedSections.filter((s: any) => s.video && s.video.trim());
          
          // Credits tracking for proprietary video service
          let totalConsumedCredits = 0;
          let lastRemainingQuota = 0;
          
          if (courseData.generateVideos && sectionsNeedingVideos.length > 0 && selectedVideoProvider) {
            setIsGeneratingVideos(true);
            setVideoProgress({ current: 0, total: sectionsNeedingVideos.length });

            try {
              // Check if we're using proprietary video provider
              if (selectedVideoProvider?.name === 'Propietario') {
                // Use proprietary video generation service (N8N + JSON2Video)
                const { GenerateProprietaryCourseVideoService } = await import('src/services/ai/ProprietaryVideoGeneration.service');

                const videoResults: Array<{ sectionIndex: number; videoUrl: string; videoId: string }> = [];

                for (let i = 0; i < sectionsNeedingVideos.length; i++) {
                  const section = sectionsNeedingVideos[i];
                  setVideoProgress({ current: i, total: sectionsNeedingVideos.length });
                  setProprietaryVideoStatus(`Generando video ${i + 1}/${sectionsNeedingVideos.length}...`);

                  try {
                    const result = await GenerateProprietaryCourseVideoService(
                      courseData.title,
                      section,
                      {
                        duration_scences: proprietaryDurationScenes,
                        scences_number: proprietaryScenesNumber,
                        image_model: proprietaryImageModel,
                      },
                      (progress) => {
                        setProprietaryVideoStatus(progress.message);
                      }
                    );

                    videoResults.push({
                      sectionIndex: i,
                      videoUrl: result.videoUrl,
                      videoId: result.videoId,
                    });
                    
                    // Accumulate credits info
                    if (result.consumedCredits) {
                      totalConsumedCredits += result.consumedCredits;
                    }
                    if (result.remainingQuota !== undefined) {
                      lastRemainingQuota = result.remainingQuota;
                    }
                  } catch (sectionError) {
                    console.error(`Failed to generate proprietary video for section ${i}:`, sectionError);
                    onError?.(
                      `Error generating proprietary video for "${section.title}": ${
                        sectionError instanceof Error ? sectionError.message : 'Unknown error'
                      }`
                    );
                    // Continue with next section even if one fails
                  }
                }

                // Update sections with video URLs
                updatedSections = updatedSections.map((section: any) => {
                  if (!section.video || !section.video.trim()) return section;

                  const sectionIndex = sectionsNeedingVideos.findIndex((s: any) => s.title === section.title);
                  const videoResult = videoResults.find((result) => result.sectionIndex === sectionIndex);

                  const videos = section.videos || [];
                  const blocks = section.blocks || [];

                  if (videoResult?.videoUrl) {
                    videos.push({
                      url: videoResult.videoUrl,
                      videoId: videoResult.videoId,
                    });

                    blocks.push({
                      id: `${section.id}-video-${Date.now()}`,
                      type: 'video',
                      order: blocks.length,
                      content: {
                        url: videoResult.videoUrl,
                        caption: section.video,
                      },
                    });
                  }

                  return {
                    ...section,
                    videos,
                    blocks,
                    videoUrl: videoResult?.videoUrl,
                  };
                });

                setProprietaryVideoStatus('');
              } else {
                // Use standard AI video generation services
                const { GenerateCourseVideosService } = await import('src/services/ai/GenerateAiVideo.service');

                const videoResults = await GenerateCourseVideosService(
                  courseData.title,
                  sectionsNeedingVideos,
                  {
                    provider: getLegacyProviderType(selectedVideoProvider),
                    seconds: 12, // Short videos
                    onProgress: (current: number, total: number, sectionProgress?: number) => {
                      setVideoProgress({ current, total });
                    },
                  }
                );

                // Update sections with video URLs in arrays
                updatedSections = updatedSections.map((section: any) => {
                  // Skip if section doesn't have a video prompt
                  if (!section.video || !section.video.trim()) return section;

                  const sectionIndex = sectionsNeedingVideos.findIndex((s: any) => s.title === section.title);
                  const videoResult = videoResults.find((result) => result.sectionIndex === sectionIndex);

                  // Initialize arrays if they don't exist
                  const videos = section.videos || [];
                  const blocks = section.blocks || [];

                  // Add new video to the array if generation was successful
                  if (videoResult?.videoUrl) {
                    videos.push({
                      url: videoResult.videoUrl,
                      videoId: videoResult.videoId,
                    });

                    // Add video block for preview rendering
                    blocks.push({
                      id: `${section.id}-video-${Date.now()}`,
                      type: 'video',
                      order: blocks.length,
                      content: {
                        url: videoResult.videoUrl,
                        caption: section.video,
                      },
                    });
                  }

                  return {
                    ...section,
                    videos,
                    blocks,
                    // Keep ALL original fields including image, video, needsImage, needsVideo
                    // Keep legacy field for backward compatibility
                    videoUrl: videoResult?.videoUrl,
                  };
                });
              }
            } catch (videoError) {
              console.error('Failed to generate videos:', videoError);
              onError?.(`Error generating videos: ${videoError instanceof Error ? videoError.message : 'Unknown error'}`);
            } finally {
              setIsGeneratingVideos(false);
              setVideoProgress({ current: 0, total: 0 });
              setProprietaryVideoStatus('');
            }
          }

          // Return final course data
          const finalCourseData = {
            ...courseData,
            bannerUrl: updatedBannerUrl,
            sections: updatedSections,
          };

          // Pass credits info if available
          const creditsInfo = totalConsumedCredits > 0 ? {
            consumed: totalConsumedCredits,
            remaining: lastRemainingQuota,
          } : undefined;

          onCourseGenerated?.(finalCourseData, creditsInfo);
        }
      } catch (e) {
        console.error('Failed to extract course data:', e);
        onError?.(`Failed to extract course data: ${e instanceof Error ? e.message : 'Unknown error'}`);
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

    // Add user message
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
        content: COURSE_GENERATION_SYSTEM_PROMPT,
        timestamp: new Date().toISOString(),
      },
      ...messages,
      userMessage,
    ];

    // Start streaming with dynamic provider config
    if (!selectedProvider || !selectedModel) {
      onError?.('No provider or model selected');
      return;
    }

    await startStream(apiMessages, {
      provider: selectedProvider,
      model: selectedModel,
      temperature,
    });
  }, [inputValue, isStreaming, messages, startStream, selectedProvider, selectedModel, temperature, onError, onGenerationStart]);

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

  // Quick prompts
  const quickPrompts: IAiGenerationPrompt[] = [
    {
      topic: t('chat.quickPrompts.webDev'),
      description: t('chat.quickPrompts.webDevDesc'),
      difficulty: 'beginner',
    },
    {
      topic: t('chat.quickPrompts.machineLearning'),
      description: t('chat.quickPrompts.machineLearningDesc'),
      difficulty: 'intermediate',
    },
    {
      topic: t('chat.quickPrompts.leadership'),
      description: t('chat.quickPrompts.leadershipDesc'),
      difficulty: 'advanced',
    },
  ];

  const handleQuickPrompt = (prompt: IAiGenerationPrompt) => {
    const promptText = `${t('chat.generateCourseFor')} "${prompt.topic}". ${prompt.description || ''} ${t('chat.difficultyLevel')}: ${prompt.difficulty}.`;
    setInputValue(promptText);
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
            <Box>
              <Typography variant="subtitle1">{t('chat.title')}</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                <Chip
                  label={selectedProvider?.name || t('chat.noProvider')}
                  size="small"
                  variant="soft"
                  color="primary"
                  icon={<Iconify icon="solar:chat-round-dots-bold" width={12} />}
                />
                <Chip
                  label={selectedImageProvider?.name || t('chat.noProvider')}
                  size="small"
                  variant="soft"
                  color="success"
                  icon={<Iconify icon="solar:gallery-circle-outline" width={12} />}
                />
                <Chip
                  label={selectedVideoProvider?.name || t('chat.noProvider')}
                  size="small"
                  variant="soft"
                  color="error"
                  icon={<Iconify icon="solar:videocamera-record-bold" width={12} />}
                />
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={() => setShowSettings(!showSettings)}>
              <Iconify icon="solar:settings-bold-duotone" />
            </IconButton>
            <IconButton size="small" onClick={handleClearChat} disabled={isStreaming}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Stack>
        </Stack>

        {/* Settings Panel */}
        {showSettings && (
          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack spacing={2}>
              {/* Loading/Error states */}
              {isLoadingProviders && (
                <Alert severity="info" icon={<CircularProgress size={16} />}>
                  {t('chat.loadingProviders') || 'Cargando proveedores...'}
                </Alert>
              )}
              {providersError && (
                <Alert severity="error">
                  {t('chat.providersError') || 'Error al cargar proveedores'}: {providersError}
                </Alert>
              )}

              {/* Language Model Settings */}
              <Typography variant="subtitle2" color="text.secondary">
                {t('chat.languageModel') || 'Modelo de Lenguaje'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('chat.provider')}</InputLabel>
                  <Select
                    value={selectedProvider?.id || ''}
                    label={t('chat.provider')}
                    onChange={(e) => selectProvider(e.target.value)}
                    disabled={isLoadingProviders}
                  >
                    {textProviders.map((provider) => (
                      <MenuItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>{t('chat.model')}</InputLabel>
                  <Select
                    value={selectedModel?.id || ''}
                    label={t('chat.model')}
                    onChange={(e) => selectModel(e.target.value)}
                    disabled={isLoadingProviders}
                  >
                    {availableModels.map((model) => (
                      <MenuItem key={model.id} value={model.id}>
                        {model.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Divider />

              {/* Image Model Settings */}
              <Typography variant="subtitle2" color="text.secondary">
                {t('chat.imageModel') || 'Modelo de Imagen'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('chat.provider') || 'Proveedor'}</InputLabel>
                  <Select
                    value={selectedImageProviderId}
                    label={t('chat.provider') || 'Proveedor'}
                    onChange={(e) => {
                      const newProviderId = e.target.value;
                      setSelectedImageProviderId(newProviderId);
                      // Auto-select default model for new provider
                      const newProvider = imageProviders.find((p) => p.id === newProviderId);
                      const defaultModel = getDefaultModel(newProvider, 'image');
                      if (defaultModel) {
                        setSelectedImageModelId(defaultModel.id);
                      }
                    }}
                    disabled={isLoadingProviders}
                  >
                    {imageProviders.map((provider) => (
                      <MenuItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>{t('chat.model') || 'Modelo'}</InputLabel>
                  <Select
                    value={selectedImageModelId}
                    label={t('chat.model') || 'Modelo'}
                    onChange={(e) => setSelectedImageModelId(e.target.value)}
                    disabled={isLoadingProviders || !selectedImageProvider}
                  >
                    {availableImageModels.map((model) => (
                      <MenuItem key={model.id} value={model.id}>
                        {model.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Divider />

              {/* Video Model Settings */}
              <Typography variant="subtitle2" color="text.secondary">
                {t('chat.videoModel') || 'Modelo de Video'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('chat.provider') || 'Proveedor'}</InputLabel>
                  <Select
                    value={selectedVideoProviderId}
                    label={t('chat.provider') || 'Proveedor'}
                    onChange={(e) => {
                      const newProviderId = e.target.value;
                      setSelectedVideoProviderId(newProviderId);
                      // Auto-select default model for new provider
                      const newProvider = videoProviders.find((p) => p.id === newProviderId);
                      const defaultModel = getDefaultModel(newProvider, 'video');
                      if (defaultModel) {
                        setSelectedVideoModelId(defaultModel.id);
                      }
                    }}
                    disabled={isLoadingProviders}
                  >
                    {videoProviders.map((provider) => (
                      <MenuItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>{t('chat.model') || 'Modelo'}</InputLabel>
                  <Select
                    value={selectedVideoModelId}
                    label={t('chat.model') || 'Modelo'}
                    onChange={(e) => setSelectedVideoModelId(e.target.value)}
                    disabled={isLoadingProviders || !selectedVideoProvider}
                  >
                    {availableVideoModels.map((model) => (
                      <MenuItem key={model.id} value={model.id}>
                        {model.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {/* Proprietary Video Options - Only shown when proprietary video provider is selected */}
              {selectedVideoProvider?.name === 'Propietario' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                  <Typography variant="caption" color="primary.dark" sx={{ mb: 2, display: 'block', fontWeight: 600 }}>
                    {t('chat.proprietaryOptions')}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>{t('chat.sceneDuration')}</InputLabel>
                      <Select
                        value={proprietaryDurationScenes}
                        label={t('chat.sceneDuration')}
                        onChange={(e) => setProprietaryDurationScenes(Number(e.target.value))}
                      >
                        <MenuItem value={4}>4 {t('chat.seconds')}</MenuItem>
                        <MenuItem value={6}>6 {t('chat.seconds')}</MenuItem>
                        <MenuItem value={12}>12 {t('chat.seconds')}</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      size="small"
                      type="number"
                      label={t('chat.scenesNumber')}
                      value={proprietaryScenesNumber}
                      onChange={(e) => setProprietaryScenesNumber(Math.max(1, Math.min(20, Number(e.target.value))))}
                      inputProps={{ min: 1, max: 20 }}
                      sx={{ minWidth: 150 }}
                      helperText={`${t('chat.totalDuration')}: ~${proprietaryDurationScenes * proprietaryScenesNumber}s`}
                    />

                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>{t('chat.imageModel') || 'Modelo de Imagen'}</InputLabel>
                      <Select
                        value={proprietaryImageModel}
                        label={t('chat.imageModel') || 'Modelo de Imagen'}
                        onChange={(e) => setProprietaryImageModel(e.target.value)}
                      >
                        {PROPRIETARY_IMAGE_MODEL_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Box>
              )}

              <Divider />

              <Box sx={{ px: 1, pb: 1 }}>
                <Typography variant="caption" gutterBottom>
                  {t('chat.temperature')}: {temperature}
                </Typography>
                <Slider
                  size="small"
                  value={temperature}
                  onChange={(_, value) => setTemperature(value as number)}
                  min={0}
                  max={1}
                  step={0.1}
                  marks={[
                    { value: 0, label: t('chat.precise') },
                    { value: 1, label: t('chat.creative') },
                  ]}
                  sx={{
                    mt: 2,
                    mb: 1.5,
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.75rem',
                      top: 28,
                    },
                  }}
                />
              </Box>
            </Stack>
          </Box>
        )}
      </Card>

      {/* Messages - Flujo natural sin scroll contenedor */}
      <Box ref={scrollRef} sx={{ py: 2 }}>
        {messages.length === 0 ? (
          <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <Iconify
              icon="tabler:robot"
              width={80}
              sx={{ color: 'primary.light', opacity: 0.5 }}
            />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {t('chat.welcome')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                {t('chat.welcomeMessage')}
              </Typography>
            </Box>

            {/* Quick Prompts */}
            <Stack spacing={1} sx={{ width: '100%', maxWidth: 500 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('chat.quickStart')}
              </Typography>
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={() => handleQuickPrompt(prompt)}
                  startIcon={<Iconify icon="solar:star-bold" />}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  {prompt.topic}
                </Button>
              ))}
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2}>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Streaming response */}
            {isStreaming && fullResponse && (
              <MessageBubble
                message={{
                  id: 'streaming',
                  role: 'assistant',
                  content: fullResponse,
                  timestamp: new Date().toISOString(),
                  isStreaming: true,
                }}
              />
            )}
          </Stack>
        )}
      </Box>

      {/* Indicadores */}
      <Card sx={{ mb: 0 }}>
        {/* Streaming indicator */}
        {isStreaming && (
          <Box sx={{ px: 2, pt: 1 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Banner generation indicator */}
        {isGeneratingBanner && (
          <Box sx={{ px: 2, py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('chat.generatingBanner') || 'Generando banner del curso...'}
              </Typography>
              <Box sx={{ flex: 1 }} />
            </Stack>
          </Box>
        )}

        {/* Image generation indicator */}
        {isGeneratingImages && (
          <Box sx={{ px: 2, py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('chat.generatingImages', {
                  current: imageProgress.current,
                  total: imageProgress.total,
                })}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(imageProgress.current / imageProgress.total) * 100}
                sx={{ flex: 1 }}
              />
            </Stack>
          </Box>
        )}

        {/* Video generation indicator */}
        {isGeneratingVideos && (
          <Box sx={{ px: 2, py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <CircularProgress size={20} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedVideoProvider?.name === 'Propietario' && proprietaryVideoStatus
                    ? proprietaryVideoStatus
                    : t('chat.generatingVideos', {
                      current: videoProgress.current,
                      total: videoProgress.total,
                    })}
                </Typography>
                {selectedVideoProvider?.name === 'Propietario' && (
                  <Typography variant="caption" color="primary.main" sx={{ display: 'block', mt: 0.5 }}>
                    {t('chat.proprietaryVideoDisclaimer')}
                  </Typography>
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={(videoProgress.current / videoProgress.total) * 100}
                sx={{ flex: 1 }}
              />
            </Stack>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Box sx={{ px: 2, py: 1 }}>
            <Chip
              label={error}
              color="error"
              size="small"
              onDelete={clearStream}
              deleteIcon={<Iconify icon="solar:close-circle-bold" />}
            />
          </Box>
        )}
      </Card>

      {/* Input - Sticky al final */}
      <Card sx={{ position: 'sticky', bottom: 16, zIndex: 10, mt: 2, boxShadow: 3 }}>
        <Stack direction="row" spacing={1} sx={{ p: 2 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat.placeholder')}
            disabled={isStreaming || isGeneratingBanner || isGeneratingImages || isGeneratingVideos}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:chat-round-dots-bold" width={20} />
                </InputAdornment>
              ),
            }}
          />

          {isStreaming ? (
            <IconButton color="error" onClick={stopStream}>
              <Iconify icon="solar:stop-circle-bold" width={28} />
            </IconButton>
          ) : (
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isGeneratingBanner || isGeneratingImages || isGeneratingVideos}
            >
              <Iconify icon="solar:forward-bold" width={28} />
            </IconButton>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}

// ----------------------------------------------------------------------
// Message Bubble Component
// ----------------------------------------------------------------------

type MessageBubbleProps = {
  message: IAiChatMessage;
};

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const { t } = useTranslate('ai-course');

  // Extract and parse JSON from content
  const extractJsonData = (content: string): any | null => {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return null;
    } catch {
      return null;
    }
  };

  // Remove JSON code blocks and the "te presento la estructura" text
  const getDisplayContent = (content: string): string => {
    let cleaned = content.replace(/```json\s*[\s\S]*?\s*```/gi, '');
    // Remove lines that mention JSON structure presentation
    cleaned = cleaned.replace(/A continuación[^\n]*formato JSON[^\n]*/gi, '');
    return cleaned.trim();
  };

  const displayContent = isUser ? message.content : getDisplayContent(message.content);
  const jsonData = !isUser ? extractJsonData(message.content) : null;

  return (
    <Stack
      direction="row"
      justifyContent={isUser ? 'flex-end' : 'flex-start'}
      spacing={1}
      sx={{ width: '100%' }}
    >
      {!isUser && (
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
          <Iconify icon="tabler:robot" width={18} />
        </Avatar>
      )}

      <Box
        sx={{
          maxWidth: isUser ? '80%' : '100%',
          width: jsonData ? '100%' : 'auto',
          p: 2,
          borderRadius: 2,
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          border: (theme) => isUser ? 'none' : `1px solid ${theme.palette.divider}`,
        }}
      >
        {isUser ? (
          <Typography variant="body2">{displayContent}</Typography>
        ) : (
          <>
            {/* Markdown content */}
            <Box
              sx={{
                '& p': { mb: 1, '&:last-child': { mb: 0 } },
                '& pre': {
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'grey.900',
                  color: 'common.white',
                  overflow: 'auto',
                  fontSize: '0.85rem',
                  my: 1,
                },
                '& code': {
                  bgcolor: 'grey.200',
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                },
                '& pre code': {
                  bgcolor: 'transparent',
                  color: 'inherit',
                },
                '& ul, & ol': { pl: 2, mb: 1 },
                '& h1, & h2, & h3, & h4': { mb: 1, mt: 2, '&:first-of-type': { mt: 0 } },
              }}
            >
              <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                {displayContent}
              </ReactMarkdown>
            </Box>

            {/* Render JSON data visually */}
            {jsonData && !message.isStreaming && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 3 }} />

                <Stack spacing={3}>
                  {/* Course Title */}
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {jsonData.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {jsonData.description}
                    </Typography>
                  </Box>

                  {/* Metadata */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                    {jsonData.difficulty && (
                      <Chip
                        label={t(`difficulty.${jsonData.difficulty}`)}
                        size="small"
                        color="primary"
                        variant="soft"
                      />
                    )}
                    {jsonData.duration && (
                      <Chip
                        icon={<Iconify icon="solar:clock-circle-bold" width={16} />}
                        label={jsonData.duration}
                        size="small"
                        variant="soft"
                      />
                    )}
                    {jsonData.language && (
                      <Chip
                        icon={<Iconify icon="solar:flag-bold" width={16} />}
                        label={jsonData.language.toUpperCase()}
                        size="small"
                        variant="soft"
                      />
                    )}
                  </Stack>

                  {/* Objectives */}
                  {jsonData.objectives && jsonData.objectives.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('preview.objectives')}
                      </Typography>
                      <Stack component="ul" spacing={0.5} sx={{ pl: 2, m: 0 }}>
                        {jsonData.objectives.map((obj: string, idx: number) => (
                          <Typography key={idx} component="li" variant="body2" color="text.secondary">
                            {obj}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Sections */}
                  {jsonData.sections && jsonData.sections.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('preview.content')} ({jsonData.sections.length} {t('sections')})
                      </Typography>
                      <Stack spacing={1}>
                        {jsonData.sections.map((section: any, idx: number) => (
                          <Card key={idx} variant="outlined" sx={{ p: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Chip label={idx + 1} size="small" />
                              <Typography variant="subtitle2">{section.title}</Typography>
                              {section.duration && (
                                <Chip
                                  label={section.duration}
                                  size="small"
                                  variant="soft"
                                />
                              )}
                            </Stack>
                            {section.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {section.description}
                              </Typography>
                            )}
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Success indicator */}
                  <Alert severity="success" icon={<Iconify icon="solar:check-circle-bold" />}>
                    <Typography variant="body2">
                      {t('chat.courseStructureGenerated')}
                    </Typography>
                  </Alert>
                </Stack>
              </Box>
            )}
          </>
        )}

        {message.isStreaming && (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: 8,
              height: 16,
              bgcolor: 'text.primary',
              ml: 0.5,
              animation: 'blink 1s infinite',
              '@keyframes blink': {
                '0%, 50%': { opacity: 1 },
                '51%, 100%': { opacity: 0 },
              },
            }}
          />
        )}
      </Box>

      {isUser && (
        <Avatar sx={{ bgcolor: 'grey.400', width: 32, height: 32 }}>
          <Iconify icon="solar:user-rounded-bold" width={18} />
        </Avatar>
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------
// Helper function to extract course data from AI response
// ----------------------------------------------------------------------

function extractCourseData(response: string): any | null {
  try {
    // Remove markdown code blocks if present
    let jsonText = response;

    // Try to find JSON in code blocks
    const jsonCodeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonCodeBlockMatch) {
      jsonText = jsonCodeBlockMatch[1];
    }

    // Try to find JSON in plain code blocks
    const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && !jsonCodeBlockMatch) {
      jsonText = codeBlockMatch[1];
    }

    // Clean up the text
    jsonText = jsonText.trim();

    // Try to parse as JSON
    if (jsonText.startsWith('{') || jsonText.startsWith('[')) {
      const parsed = JSON.parse(jsonText);

      // If it's the Gemini response format, extract the actual content
      if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
        const innerText = parsed.candidates[0].content.parts[0].text;
        // Try to parse the inner content as JSON
        try {
          return normalizeCourseData(JSON.parse(innerText));
        } catch {
          return null;
        }
      }

      // If it has the expected course structure
      if (parsed.title || parsed.course_metadata || parsed.sections) {
        return normalizeCourseData(parsed);
      }
    }

    // Try to find a JSON object anywhere in the response
    const objectMatch = response.match(/\{[\s\S]*?"title"[\s\S]*?\}/);
    if (objectMatch) {
      return normalizeCourseData(JSON.parse(objectMatch[0]));
    }

    return null;
  } catch (e) {
    console.error('Failed to extract course data:', e);
    return null;
  }
}

// Normalize course data to ensure all required fields are present
function normalizeCourseData(courseData: any): any {
  if (!courseData) return null;

  return {
    ...courseData,
    banner: courseData.banner || '',
    bannerUrl: courseData.bannerUrl || '',
    sections: (courseData.sections || []).map((section: any) => ({
      ...section,
      // Ensure all media-related fields exist
      image: section.image || '',
      video: section.video || '',
      needsImage: section.needsImage ?? false,
      needsVideo: section.needsVideo ?? false,
      images: section.images || [],
      videos: section.videos || [],
      // Legacy fields
      imageUrl: section.imageUrl || '',
      videoUrl: section.videoUrl || '',
    })),
  };
}
