'use client';

// ----------------------------------------------------------------------
// AI Program Chat Panel Component
// Streaming chat interface for AI program generation
// Uses courses from integration instances as context
// ----------------------------------------------------------------------

import type { IAiProvider, IAiProviderModel } from 'src/types/ai-provider';
import type { IAiChatMessage, IAiGenerationPrompt } from 'src/types/ai-course-generation';
import type {
  ICatalogCourse,
  ICatalogCategory,
  ICatalogDifficultyLevel,
  ICatalogIntegrationInstance,
} from 'src/types/ai-program-generation';

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
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useAiProvidersDynamic, useAiStreamingDynamic } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetCoursesPaginationService } from 'src/services/learning/courses.service';
import { GetIntegrationsPaginationService } from 'src/services/settings/integrations.service';
import {
  GetLearningObjectsSelectLevelsService,
  GetLearningObjectsSelectCategoriesService,
} from 'src/services/learning/learningObjects.service';

import { Iconify } from 'src/components/iconify';

import { parseCapabilities } from 'src/types/ai-provider';
import { PROGRAM_GENERATION_SYSTEM_PROMPT } from 'src/types/ai-program-generation';

// ----------------------------------------------------------------------

type Props = {
  onProgramGenerated?: (programData: any) => void;
  onError?: (error: string) => void;
  onGenerationStart?: () => void;
};

// ----------------------------------------------------------------------

const PROPRIETARY_IMAGE_MODEL_OPTIONS = [
  { label: 'Google', value: 'Google' },
  { label: 'OpenAI', value: 'OpenAI' },
];

// ----------------------------------------------------------------------

export function AiProgramChatPanel({ onProgramGenerated, onError, onGenerationStart }: Props) {
  const { t } = useTranslate('ai');
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasAutoSelectedInstanceRef = useRef(false);

  const [messages, setMessages] = useState<IAiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // Integration instance state
  const [integrationInstances, setIntegrationInstances] = useState<ICatalogIntegrationInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<ICatalogIntegrationInstance | null>(null);
  const [instanceSearchInput, setInstanceSearchInput] = useState('');
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);

  // Course catalog state
  const [courseCatalog, setCourseCatalog] = useState<ICatalogCourse[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Category and difficulty level catalogs
  const [categoriesCatalog, setCategoriesCatalog] = useState<ICatalogCategory[]>([]);
  const [difficultyLevelsCatalog, setDifficultyLevelsCatalog] = useState<ICatalogDifficultyLevel[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);

  // Image model state
  const [selectedImageProviderId, setSelectedImageProviderId] = useState<string>('');
  const [selectedImageModelId, setSelectedImageModelId] = useState<string>('');

  // Video model state
  const [selectedVideoProviderId, setSelectedVideoProviderId] = useState<string>('');
  const [selectedVideoModelId, setSelectedVideoModelId] = useState<string>('');

  // Proprietary video options
  const [proprietaryDurationScenes, setProprietaryDurationScenes] = useState<number>(4);
  const [proprietaryScenesNumber, setProprietaryScenesNumber] = useState<number>(1);
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
    getLegacyProviderType,
  } = useAiProvidersDynamic({ capability: 'text' });

  // Helper to find default provider and model
  const findDefaultProviderAndModel = useCallback(
    (providers: IAiProvider[], capability: 'text' | 'image' | 'video'): { provider: IAiProvider; model: IAiProviderModel } | null => {
      for (const provider of providers) {
        const modelsWithCapability = provider.models.filter((model) => {
          const caps = parseCapabilities(model.capabilities);
          return caps.includes(capability);
        });
        const defaultModel = modelsWithCapability.find((m) => m.isDefault);
        if (defaultModel) return { provider, model: defaultModel };
      }
      if (providers.length > 0) {
        const firstProvider = providers[0];
        const modelsWithCapability = firstProvider.models.filter((model) => {
          const caps = parseCapabilities(model.capabilities);
          return caps.includes(capability);
        });
        if (modelsWithCapability.length > 0) return { provider: firstProvider, model: modelsWithCapability[0] };
      }
      return null;
    },
    []
  );

  const getDefaultModel = useCallback(
    (provider: IAiProvider | undefined, capability: 'text' | 'image' | 'video'): IAiProviderModel | undefined => {
      if (!provider) return undefined;
      const modelsWithCapability = provider.models.filter((model) => {
        const caps = parseCapabilities(model.capabilities);
        return caps.includes(capability);
      });
      return modelsWithCapability.find((m) => m.isDefault) || modelsWithCapability[0];
    },
    []
  );

  // Image provider computed values
  const selectedImageProvider = imageProviders.find((p) => p.id === selectedImageProviderId);
  const availableImageModels = useMemo(() => {
    if (!selectedImageProvider) return [];
    return selectedImageProvider.models.filter((model) => {
      const caps = parseCapabilities(model.capabilities);
      return caps.includes('image');
    });
  }, [selectedImageProvider]);
  const selectedImageModel = availableImageModels.find((m) => m.id === selectedImageModelId);

  // Video provider computed values
  const selectedVideoProvider = videoProviders.find((p) => p.id === selectedVideoProviderId);
  const availableVideoModels = useMemo(() => {
    if (!selectedVideoProvider) return [];
    return selectedVideoProvider.models.filter((model) => {
      const caps = parseCapabilities(model.capabilities);
      return caps.includes('video');
    });
  }, [selectedVideoProvider]);
  const selectedVideoModel = availableVideoModels.find((m) => m.id === selectedVideoModelId);

  // Set default image provider when loaded
  useEffect(() => {
    if (imageProviders.length > 0 && !selectedImageProviderId) {
      const defaultConfig = findDefaultProviderAndModel(imageProviders, 'image');
      if (defaultConfig) {
        setSelectedImageProviderId(defaultConfig.provider.id);
        setSelectedImageModelId(defaultConfig.model.id);
      }
    }
  }, [imageProviders, selectedImageProviderId, findDefaultProviderAndModel]);

  // Set default video provider when loaded
  useEffect(() => {
    if (videoProviders.length > 0 && !selectedVideoProviderId) {
      const defaultConfig = findDefaultProviderAndModel(videoProviders, 'video');
      if (defaultConfig) {
        setSelectedVideoProviderId(defaultConfig.provider.id);
        setSelectedVideoModelId(defaultConfig.model.id);
      }
    }
  }, [videoProviders, selectedVideoProviderId, findDefaultProviderAndModel]);

  // Load integration instances: handles both initial load and search-as-you-type
  useEffect(() => {
    const delay = instanceSearchInput.trim() ? 300 : 0;

    const searchTimeout = setTimeout(async () => {
      setIsLoadingInstances(true);
      try {
        const response = await GetIntegrationsPaginationService({
          page: 1,
          perPage: 20,
          ...(instanceSearchInput.trim() ? { search: instanceSearchInput } : {}),
        });
        const items: ICatalogIntegrationInstance[] = (response?.data?.data || []).map((item: any) => ({
          id: item.id,
          instanceName: item.instanceName,
          isActive: item.isActive,
          integration: item.integration,
        }));
        setIntegrationInstances(items);
        // Auto-select first instance only on initial load
        if (!hasAutoSelectedInstanceRef.current && !instanceSearchInput.trim() && items.length > 0) {
          setSelectedInstance(items[0]);
          hasAutoSelectedInstanceRef.current = true;
        }
      } catch (err) {
        console.error('Error loading integration instances:', err);
        setIntegrationInstances([]);
      } finally {
        setIsLoadingInstances(false);
      }
    }, delay);

    return () => clearTimeout(searchTimeout);
  }, [instanceSearchInput]);

  // Load courses when selected instance changes
  useEffect(() => {
    if (!selectedInstance) {
      setCourseCatalog([]);
      return;
    }

    const loadCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const response = await GetCoursesPaginationService({
          page: 1,
          perPage: 20,
          instanceId: selectedInstance.id,
        });
        const items: ICatalogCourse[] = (response?.data?.data || []).map((item: any) => ({
          id: String(item.id),
          lmsCourseId: item.lmsCourseId,
          displayName: item.displayName,
          shortDescription: item.shortDescription || '',
          image: item.image || '',
          integrationName: item.integrationName || '',
        }));
        setCourseCatalog(items);
      } catch (err) {
        console.error('Error loading courses:', err);
        setCourseCatalog([]);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, [selectedInstance]);

  // Load categories and difficulty levels on mount
  useEffect(() => {
    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true);
      try {
        const [categoriesRes, levelsRes] = await Promise.all([
          GetLearningObjectsSelectCategoriesService({ page: 1, perPage: 20 }),
          GetLearningObjectsSelectLevelsService(),
        ]);

        const categories: ICatalogCategory[] = (categoriesRes?.data?.data || []).map((item: any) => ({
          id: String(item.id),
          name: item.name || '',
          abreviation: item.abreviation || '',
        }));
        setCategoriesCatalog(categories);

        const levels: ICatalogDifficultyLevel[] = (Array.isArray(levelsRes?.data) ? levelsRes.data : levelsRes?.data?.data || []).map((item: any) => ({
          id: String(item.id),
          name: item.name || '',
          levelOrder: item.levelOrder,
        }));
        setDifficultyLevelsCatalog(levels);
      } catch (err) {
        console.error('Error loading catalogs:', err);
      } finally {
        setIsLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, []);



  // Build catalog context for system prompt
  const catalogContext = useMemo(() => {
    const sections: string[] = [];

    // Categories catalog
    if (categoriesCatalog.length > 0) {
      const list = categoriesCatalog.map((c) => `- id: ${c.id} | Name: "${c.name}"`).join('\n');
      sections.push(`**CATEGORIES CATALOG (${categoriesCatalog.length}):**\n${list}`);
    } else {
      sections.push('**CATEGORIES CATALOG: No categories available.**');
    }

    // Difficulty levels catalog
    if (difficultyLevelsCatalog.length > 0) {
      const list = difficultyLevelsCatalog.map((l) => `- id: ${l.id} | Name: "${l.name}"`).join('\n');
      sections.push(`**DIFFICULTY LEVELS CATALOG (${difficultyLevelsCatalog.length}):**\n${list}`);
    } else {
      sections.push('**DIFFICULTY LEVELS CATALOG: No difficulty levels available.**');
    }

    // Courses catalog
    if (courseCatalog.length > 0) {
      const sanitize = (str: string) =>
        str.replace(/`/g, "'").replace(/[\n\r\t]/g, ' ').replace(/"/g, "'").trim();
      const list = courseCatalog.map((c) =>
        `- id: "${c.id}" | Name: "${sanitize(c.displayName)}" | Description: "${sanitize(c.shortDescription)}"`
      ).join('\n');
      sections.push(`**COURSES CATALOG (${courseCatalog.length}):**\n${list}`);
    } else {
      sections.push('**COURSES CATALOG: No courses available. Inform the user that there are no courses to create a program.**');
    }

    return `\n\n${sections.join('\n\n')}`;
  }, [courseCatalog, categoriesCatalog, difficultyLevelsCatalog]);

  const {
    isStreaming,
    fullResponse,
    error,
    startStream,
    stopStream,
    clearStream,
  } = useAiStreamingDynamic({
    onComplete: async (response) => {
      const assistantMessage: IAiChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const programData = extractProgramData(response, courseCatalog);
        if (programData) {
          let updatedBannerUrl = programData.bannerUrl || '';
          let updatedImageUrl = programData.imageUrl || '';
          let updatedVideoUrl = programData.videoUrl || '';

          // Generate banner image
          if (programData.banner && programData.generateBanner && selectedImageProvider && selectedImageModel) {
            setIsGeneratingBanner(true);
            try {
              const { GenerateAndUploadAiImageService } = await import('src/services/ai/GenerateAiImage.service');
              const bannerResult = await GenerateAndUploadAiImageService({
                prompt: programData.banner,
                size: '1536x1024',
                provider: getLegacyProviderType(selectedImageProvider),
                model: selectedImageModel.modelKey,
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

          // Generate cover image
          if (programData.cover && programData.generateCover && selectedImageProvider && selectedImageModel) {
            setIsGeneratingCover(true);
            try {
              const { GenerateAndUploadAiImageService } = await import('src/services/ai/GenerateAiImage.service');
              const coverResult = await GenerateAndUploadAiImageService({
                prompt: programData.cover,
                size: '1024x1024',
                provider: getLegacyProviderType(selectedImageProvider),
                model: selectedImageModel.modelKey,
              });
              if (coverResult?.imageUrl) {
                updatedImageUrl = coverResult.imageUrl;
              }
            } catch (coverError) {
              console.error('Failed to generate cover:', coverError);
            } finally {
              setIsGeneratingCover(false);
            }
          }

          // Generate video
          if (selectedVideoProvider && selectedVideoModel) {
            setIsGeneratingVideo(true);
            try {
              const providerType = getLegacyProviderType(selectedVideoProvider);

              if (providerType === 'proprietary') {
                const { GenerateProprietaryVideoService } = await import('src/services/ai/ProprietaryVideoGeneration.service');
                const sanitizedName = (programData.name || '').replace(/["\\]/g, '');
                const sanitizedDesc = (programData.description || '').replace(/["\\]/g, '');
                const videoResult = await GenerateProprietaryVideoService({
                  user_prompt: `Create a professional introduction video for the learning program: ${sanitizedName}. ${sanitizedDesc}`,
                  duration_scences: proprietaryDurationScenes,
                  scences_number: proprietaryScenesNumber,
                  image_model: proprietaryImageModel,
                });
                if (videoResult?.videoUrl) {
                  updatedVideoUrl = videoResult.videoUrl;
                }
              } else {
                const { GenerateAndUploadAiVideoService } = await import('src/services/ai/GenerateAiVideo.service');
                const videoResult = await GenerateAndUploadAiVideoService(
                  {
                    prompt: `Create a professional introduction video for the learning program: "${programData.name}". ${programData.description || ''}`,
                    provider: providerType,
                    seconds: 4,
                    size: '1280x720',
                  },
                  { fileName: `program-video-${Date.now()}.mp4` },
                );
                if (videoResult?.videoUrl) {
                  updatedVideoUrl = videoResult.videoUrl;
                }
              }
            } catch (videoError) {
              console.error('Failed to generate video:', videoError);
            } finally {
              setIsGeneratingVideo(false);
            }
          }

          const finalProgramData = {
            ...programData,
            bannerUrl: updatedBannerUrl,
            imageUrl: updatedImageUrl,
            videoUrl: updatedVideoUrl,
          };

          onProgramGenerated?.(finalProgramData);
        }
      } catch (e) {
        console.error('Failed to extract program data:', e);
        onError?.(`Error extracting program data: ${e instanceof Error ? e.message : 'Error'}`);
      }
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  // Auto-scroll
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

    const systemPrompt = PROGRAM_GENERATION_SYSTEM_PROMPT + catalogContext;

    const apiMessages: IAiChatMessage[] = [
      {
        id: 'system',
        role: 'system',
        content: systemPrompt,
        timestamp: new Date().toISOString(),
      },
      ...messages,
      userMessage,
    ];

    if (!selectedProvider || !selectedModel) {
      onError?.(t('ai-program-generation.chat.noProvider'));
      return;
    }

    await startStream(apiMessages, {
      provider: selectedProvider,
      model: selectedModel,
      temperature,
    });
  }, [
    t,
    inputValue,
    isStreaming,
    messages,
    startStream,
    selectedProvider,
    selectedModel,
    temperature,
    onError,
    onGenerationStart,
    catalogContext,
  ]);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    clearStream();
  };

  // Quick prompts
  const quickPrompts: IAiGenerationPrompt[] = [
    {
      topic: t('ai-program-generation.chat.quickPrompts.webDev'),
      description: t('ai-program-generation.chat.quickPrompts.webDevDesc'),
      difficulty: 'beginner',
    },
    {
      topic: t('ai-program-generation.chat.quickPrompts.ai'),
      description: t('ai-program-generation.chat.quickPrompts.aiDesc'),
      difficulty: 'intermediate',
    },
    {
      topic: t('ai-program-generation.chat.quickPrompts.leadership'),
      description: t('ai-program-generation.chat.quickPrompts.leadershipDesc'),
      difficulty: 'advanced',
    },
  ];

  const handleQuickPrompt = (prompt: IAiGenerationPrompt) => {
    setInputValue(`${t('ai-program-generation.chat.createProgramAbout')} "${prompt.topic}". ${prompt.description || ''}`);
  };

  const isGeneratingMedia = isGeneratingBanner || isGeneratingCover || isGeneratingVideo;

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
              <Iconify icon="solar:book-bold" width={20} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1">{t('ai-program-generation.chat.title')}</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                <Chip
                  label={selectedProvider?.name || t('ai-program-generation.chat.noProvider')}
                  size="small"
                  variant="soft"
                  color="primary"
                  icon={<Iconify icon="solar:chat-round-dots-bold" width={12} />}
                />
                <Chip
                  label={selectedImageProvider?.name || t('ai-program-generation.chat.noProvider')}
                  size="small"
                  variant="soft"
                  color="success"
                  icon={<Iconify icon="solar:gallery-circle-outline" width={12} />}
                />
                <Chip
                  label={selectedVideoProvider?.name || t('ai-program-generation.chat.noProvider')}
                  size="small"
                  variant="soft"
                  color="warning"
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
              {isLoadingProviders && (
                <Alert severity="info" icon={<CircularProgress size={16} />}>
                  {t('ai-program-generation.chat.loadingProviders')}
                </Alert>
              )}
              {providersError && (
                <Alert severity="error">
                  {t('ai-program-generation.chat.providersError')}: {providersError}
                </Alert>
              )}

              {/* Integration Instance Selector */}
              <Typography variant="subtitle2" color="text.secondary">
                {t('ai-program-generation.chat.integrationInstance')}
              </Typography>
              <Autocomplete
                size="small"
                options={integrationInstances}
                getOptionLabel={(option) => option.instanceName}
                value={selectedInstance}
                onChange={(_, newValue) => setSelectedInstance(newValue)}
                onInputChange={(_, newInputValue, reason) => {
                  // Solo buscar cuando el usuario escribe; al seleccionar o limpiar, recargar todo
                  if (reason === 'input') {
                    setInstanceSearchInput(newInputValue);
                  } else {
                    setInstanceSearchInput('');
                  }
                }}
                filterOptions={(x) => x}
                loading={isLoadingInstances}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('ai-program-generation.chat.instance')}
                    placeholder={t('ai-program-generation.chat.searchInstance')}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingInstances && <CircularProgress color="inherit" size={20} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
              />

              {/* Courses catalog indicator */}
              {isLoadingCourses || isLoadingCatalogs ? (
                <Alert severity="info" icon={<CircularProgress size={16} />}>
                  {t('ai-program-generation.chat.loadingPrograms')}
                </Alert>
              ) : (
                <Alert severity={courseCatalog.length > 0 ? 'success' : 'warning'}>
                  {courseCatalog.length > 0
                    ? t('ai-program-generation.chat.coursesAvailable', { count: courseCatalog.length })
                    : t('ai-program-generation.chat.noCoursesFound')}
                </Alert>
              )}

              <Divider />

              {/* Language Model Settings */}
              <Typography variant="subtitle2" color="text.secondary">
                {t('ai-program-generation.chat.languageModel')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('ai-program-generation.chat.provider')}</InputLabel>
                  <Select
                    value={selectedProvider?.id || ''}
                    label={t('ai-program-generation.chat.provider')}
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
                  <InputLabel>{t('ai-program-generation.chat.model')}</InputLabel>
                  <Select
                    value={selectedModel?.id || ''}
                    label={t('ai-program-generation.chat.model')}
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
                {t('ai-program-generation.chat.imageModel')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('ai-program-generation.chat.provider')}</InputLabel>
                  <Select
                    value={selectedImageProviderId}
                    label={t('ai-program-generation.chat.provider')}
                    onChange={(e) => {
                      const newProviderId = e.target.value;
                      setSelectedImageProviderId(newProviderId);
                      const newProvider = imageProviders.find((p) => p.id === newProviderId);
                      const defModel = getDefaultModel(newProvider, 'image');
                      if (defModel) setSelectedImageModelId(defModel.id);
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
                  <InputLabel>{t('ai-program-generation.chat.model')}</InputLabel>
                  <Select
                    value={selectedImageModelId}
                    label={t('ai-program-generation.chat.model')}
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
                {t('ai-program-generation.chat.videoModel')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('ai-program-generation.chat.provider')}</InputLabel>
                  <Select
                    value={selectedVideoProviderId}
                    label={t('ai-program-generation.chat.provider')}
                    onChange={(e) => {
                      const newProviderId = e.target.value;
                      setSelectedVideoProviderId(newProviderId);
                      const newProvider = videoProviders.find((p) => p.id === newProviderId);
                      const defModel = getDefaultModel(newProvider, 'video');
                      if (defModel) setSelectedVideoModelId(defModel.id);
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
                  <InputLabel>{t('ai-program-generation.chat.model')}</InputLabel>
                  <Select
                    value={selectedVideoModelId}
                    label={t('ai-program-generation.chat.model')}
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

              {selectedVideoProvider && getLegacyProviderType(selectedVideoProvider) === 'proprietary' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                  <Typography variant="caption" color="primary.dark" sx={{ mb: 2, display: 'block', fontWeight: 600 }}>
                    {t('ai-program-generation.chat.proprietaryOptions') || 'Opciones Propietarias'}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>{t('ai-program-generation.chat.sceneDuration') || 'Duracion por Escena'}</InputLabel>
                      <Select
                        value={proprietaryDurationScenes}
                        label={t('ai-program-generation.chat.sceneDuration') || 'Duracion por Escena'}
                        onChange={(e) => setProprietaryDurationScenes(Number(e.target.value))}
                      >
                        <MenuItem value={4}>4 {t('ai-program-generation.chat.seconds') || 'segundos'}</MenuItem>
                        <MenuItem value={6}>6 {t('ai-program-generation.chat.seconds') || 'segundos'}</MenuItem>
                        <MenuItem value={12}>12 {t('ai-program-generation.chat.seconds') || 'segundos'}</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      size="small"
                      type="number"
                      label={t('ai-program-generation.chat.scenesNumber') || 'Numero de Escenas'}
                      value={proprietaryScenesNumber}
                      onChange={(e) => setProprietaryScenesNumber(Math.max(1, Math.min(20, Number(e.target.value))))}
                      inputProps={{ min: 1, max: 20 }}
                      sx={{ minWidth: 150 }}
                      helperText={`${t('ai-program-generation.chat.totalDuration') || 'Duracion total'}: ~${proprietaryDurationScenes * proprietaryScenesNumber}s`}
                    />

                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>{t('ai-program-generation.chat.imageModel') || 'Modelo de Imagen'}</InputLabel>
                      <Select
                        value={proprietaryImageModel}
                        label={t('ai-program-generation.chat.imageModel') || 'Modelo de Imagen'}
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
            </Stack>
          </Box>
        )}
      </Card>

      {/* Messages */}
      <Box ref={scrollRef} sx={{ py: 2 }}>
        {messages.length === 0 ? (
          <Stack spacing={3} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <Iconify
              icon="solar:book-bold"
              width={80}
              sx={{ color: 'primary.light', opacity: 0.5 }}
            />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {t('ai-program-generation.chat.welcomeTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                {t('ai-program-generation.chat.welcomeMessage')}
              </Typography>
            </Box>

            {/* Quick Prompts */}
            <Stack spacing={1} sx={{ width: '100%', maxWidth: 500 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('ai-program-generation.chat.quickStart')}
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
              <ProgramMessageBubble key={message.id} message={message} courseCatalog={courseCatalog} />
            ))}

            {isStreaming && fullResponse && (
              <ProgramMessageBubble
                courseCatalog={courseCatalog}
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

      {/* Indicators */}
      <Card sx={{ mb: 0 }}>
        {isStreaming && (
          <Box sx={{ px: 2, pt: 1 }}>
            <LinearProgress />
          </Box>
        )}

        {isGeneratingBanner && (
          <Box sx={{ px: 2, py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('ai-program-generation.chat.generatingBanner')}
              </Typography>
            </Stack>
          </Box>
        )}

        {isGeneratingCover && (
          <Box sx={{ px: 2, py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('ai-program-generation.chat.generatingCover')}
              </Typography>
            </Stack>
          </Box>
        )}

        {isGeneratingVideo && (
          <Box sx={{ px: 2, py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('ai-program-generation.chat.generatingVideo')}
              </Typography>
            </Stack>
          </Box>
        )}

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

      {/* Input */}
      <Card sx={{ position: 'sticky', bottom: 16, zIndex: 10, mt: 2, boxShadow: 3 }}>
        <Stack direction="row" spacing={1} sx={{ p: 2 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('ai-program-generation.chat.placeholder')}
            disabled={isStreaming || isGeneratingMedia}
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
              disabled={!inputValue.trim() || isGeneratingMedia}
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
// Program Message Bubble Component
// ----------------------------------------------------------------------

type MessageBubbleProps = {
  message: IAiChatMessage;
  courseCatalog?: ICatalogCourse[];
};

function ProgramMessageBubble({ message, courseCatalog = [] }: MessageBubbleProps) {
  const { t } = useTranslate('ai');
  const isUser = message.role === 'user';

  const extractJsonData = (content: string): any | null => {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[1]);
      if (!parsed?.courses?.length || !courseCatalog.length) return parsed;
      const catalogMap = new Map(courseCatalog.map((c) => [c.id, c]));
      return {
        ...parsed,
        courses: parsed.courses.map((course: any, idx: number) => {
          const catalogItem = catalogMap.get(course.courseLmsId);
          return {
            ...course,
            displayName: catalogItem?.displayName || course.displayName || '',
            shortDescription: catalogItem?.shortDescription || course.shortDescription || '',
            image: catalogItem?.image || course.image || '',
            order: course.order ?? idx + 1,
          };
        }),
      };
    } catch {
      return null;
    }
  };

  const getDisplayContent = (content: string): string => {
    let cleaned = content.replace(/```json\s*[\s\S]*?\s*```/gi, '');
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
          <Iconify icon="solar:book-bold" width={18} />
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
            <Box
              sx={{
                '& p': { mb: 1, '&:last-child': { mb: 0 } },
                '& pre': { p: 1.5, borderRadius: 1, bgcolor: 'grey.900', color: 'common.white', overflow: 'auto', fontSize: '0.85rem', my: 1 },
                '& code': { bgcolor: 'grey.200', px: 0.5, py: 0.25, borderRadius: 0.5, fontFamily: 'monospace', fontSize: '0.85rem' },
                '& pre code': { bgcolor: 'transparent', color: 'inherit' },
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
                  {/* Program Title */}
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {jsonData.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {jsonData.description}
                    </Typography>
                  </Box>

                  {/* Metadata */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                    {jsonData.duration && (
                      <Chip
                        icon={<Iconify icon="solar:clock-circle-bold" width={16} />}
                        label={jsonData.duration}
                        size="small"
                        variant="soft"
                      />
                    )}
                    {jsonData.tags && (
                      <Chip label={jsonData.tags} size="small" variant="soft" color="primary" />
                    )}
                  </Stack>

                  {/* Courses */}
                  {jsonData.courses?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('ai-program-generation.coursesIncluded', { count: jsonData.courses.length })}
                      </Typography>
                      <Stack spacing={1.5}>
                        {jsonData.courses.map((course: any, idx: number) => (
                          <Card key={idx} variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
                            <Stack direction="row" spacing={2}>
                              {course.image ? (
                                <Box
                                  component="img"
                                  src={course.image}
                                  alt={course.displayName}
                                  sx={{
                                    width: 120,
                                    minHeight: 90,
                                    objectFit: 'cover',
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: 120,
                                    minHeight: 90,
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'grey.100',
                                  }}
                                >
                                  <Iconify icon="solar:book-bold" width={32} sx={{ color: 'grey.400' }} />
                                </Box>
                              )}
                              <Stack spacing={0.5} sx={{ py: 1.5, pr: 2, minWidth: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Chip label={idx + 1} size="small" color="primary" />
                                  <Typography variant="subtitle2" noWrap>
                                    {course.displayName || course.courseLmsId}
                                  </Typography>
                                </Stack>
                                {course.shortDescription && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {course.shortDescription}
                                  </Typography>
                                )}
                              </Stack>
                            </Stack>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Success indicator */}
                  <Alert severity="success" icon={<Iconify icon="solar:check-circle-bold" />}>
                    <Typography variant="body2">
                      {t('ai-program-generation.chat.programGeneratedSuccess')}
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
// Helper to extract program data from AI response
// ----------------------------------------------------------------------

function extractProgramData(response: string, catalog: ICatalogCourse[]): any | null {
  try {
    let jsonText = response;

    const jsonCodeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonCodeBlockMatch) {
      jsonText = jsonCodeBlockMatch[1];
    }

    const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && !jsonCodeBlockMatch) {
      jsonText = codeBlockMatch[1];
    }

    jsonText = jsonText.trim();

    // Clean common AI JSON mistakes before parsing
    // NOTE: Do NOT strip // or /* */ comments \u2014 those regexes also destroy
    // URLs like "https://..." inside string values.
    // Only strip trailing commas which are safe to remove.
    jsonText = jsonText
      .replace(/,(\s*[}\]])/g, '$1');

    if (jsonText.startsWith('{') || jsonText.startsWith('[')) {
      const parsed = JSON.parse(jsonText);

      if (parsed.name && parsed.courses) {
        // Enrich courses with catalog data - map by id
        const catalogMapById = new Map(catalog.map((c) => [c.id, c]));

        return {
          ...parsed,
          banner: parsed.banner || '',
          bannerUrl: parsed.bannerUrl || '',
          imageUrl: parsed.imageUrl || '',
          videoUrl: parsed.videoUrl || '',
          courses: (parsed.courses || []).map((course: any, idx: number) => {
            const catalogItem = catalogMapById.get(course.courseLmsId);
            return {
              courseLmsId: course.courseLmsId,
              displayName: catalogItem?.displayName || course.displayName || '',
              shortDescription: catalogItem?.shortDescription || course.shortDescription || '',
              image: catalogItem?.image || course.image || '',
              order: course.order ?? idx + 1,
            };
          }),
        };
      }
    }

    return null;
  } catch (e) {
    console.error('Failed to extract program data:', e);
    return null;
  }
}
