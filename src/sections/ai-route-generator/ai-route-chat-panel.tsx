'use client';

// ----------------------------------------------------------------------
// AI Route Chat Panel Component
// Streaming chat interface for AI learning path generation
// Uses programs from learning objects as context
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
import { GetPositionPaginationService } from 'src/services/learning/position.service';
import { GetCompetenciesKmPaginationService } from 'src/services/learning/competencesKm.service';
import { GetLearningObjectsPaginationService, GetLearningObjectsSelectLevelsService } from 'src/services/learning/learningObjects.service';

import { Iconify } from 'src/components/iconify';

import { parseCapabilities } from 'src/types/ai-provider';
import { ROUTE_GENERATION_SYSTEM_PROMPT } from 'src/types/ai-route-generation';

// ----------------------------------------------------------------------

type CatalogProgram = {
  id: number;
  displayName: string;
  shortDescription: string;
  image?: string;
};

type CatalogPosition = {
  id: number;
  name: string;
};

type CatalogCompetency = {
  id: number;
  name: string;
};

type CatalogSkillLevel = {
  id: number;
  name: string;
  levelOrder?: number;
};

type Props = {
  onRouteGenerated?: (routeData: any) => void;
  onError?: (error: string) => void;
  onGenerationStart?: () => void;
};

// ----------------------------------------------------------------------

const PROPRIETARY_IMAGE_MODEL_OPTIONS = [
  { label: 'Google', value: 'Google' },
  { label: 'OpenAI', value: 'OpenAI' },
];

// ----------------------------------------------------------------------

export function AiRouteChatPanel({ onRouteGenerated, onError, onGenerationStart }: Props) {
  const { t } = useTranslate('ai');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<IAiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // Program catalog state
  const [programCatalog, setProgramCatalog] = useState<CatalogProgram[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

  // Additional catalogs
  const [positionsCatalog, setPositionsCatalog] = useState<CatalogPosition[]>([]);
  const [competenciesCatalog, setCompetenciesCatalog] = useState<CatalogCompetency[]>([]);
  const [skillLevelsCatalog, setSkillLevelsCatalog] = useState<CatalogSkillLevel[]>([]);
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

  const selectedImageProvider = imageProviders.find((p) => p.id === selectedImageProviderId);

  const availableImageModels = useMemo(() => {
    if (!selectedImageProvider) return [];
    return selectedImageProvider.models.filter((model) => {
      const caps = parseCapabilities(model.capabilities);
      return caps.includes('image');
    });
  }, [selectedImageProvider]);

  const selectedImageModel = availableImageModels.find((m) => m.id === selectedImageModelId);

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

  // Load learning objects on mount
  useEffect(() => {
    const loadLearningObjects = async () => {
      setIsLoadingPrograms(true);
      try {
        const response = await GetLearningObjectsPaginationService({
          page: 1,
          perPage: 100,
        });
        const items: CatalogProgram[] = (response?.data?.data || []).map((item: any) => ({
          id: Number(item.id),
          displayName: item.name,
          shortDescription: item.description?.replace(/<[^>]*>/g, '') || '',
          image: item.imageUrl || '',
        }));
        setProgramCatalog(items);
      } catch (err) {
        console.error('Error loading learning objects:', err);
        setProgramCatalog([]);
      } finally {
        setIsLoadingPrograms(false);
      }
    };

    loadLearningObjects();
  }, []);

  // Load positions, competencies and skill levels on mount
  useEffect(() => {
    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true);
      try {
        const [positionsRes, competenciesRes, levelsRes] = await Promise.all([
          GetPositionPaginationService({ page: 1, perPage: 20 }),
          GetCompetenciesKmPaginationService({ page: 1, perPage: 20 }),
          GetLearningObjectsSelectLevelsService(),
        ]);

        // Positions: strip to essentials (id, name)
        const posItems: CatalogPosition[] = (positionsRes?.data?.data || []).map((item: any) => ({
          id: Number(item.id),
          name: item.name || '',
        }));
        setPositionsCatalog(posItems);

        // Competencies: response is [[...items], count]
        const compData = competenciesRes?.data?.data;
        const compItems: CatalogCompetency[] = (Array.isArray(compData?.[0]) ? compData[0] : compData?.data || []).map((item: any) => ({
          id: Number(item.id),
          name: item.name || '',
        }));
        setCompetenciesCatalog(compItems);

        // Skill levels: flat array with {id, name, levelOrder}
        const levelsData = levelsRes?.data?.data || levelsRes?.data || [];
        const levelItems: CatalogSkillLevel[] = (Array.isArray(levelsData) ? levelsData : []).map((item: any) => ({
          id: Number(item.id),
          name: item.name || '',
          levelOrder: item.levelOrder,
        }));
        setSkillLevelsCatalog(levelItems);
      } catch (err) {
        console.error('Error loading catalogs:', err);
      } finally {
        setIsLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, []);

  // Build full catalog context for the system prompt
  const catalogContext = useMemo(() => {
    const sections: string[] = [];

    // Positions catalog
    if (positionsCatalog.length > 0) {
      const list = positionsCatalog.map((p) => `- id: ${p.id} | Name: "${p.name}"`).join('\n');
      sections.push(`**POSITIONS CATALOG (${positionsCatalog.length}):**\n${list}`);
    } else {
      sections.push('**POSITIONS CATALOG: No positions available.**');
    }

    // Competencies catalog
    if (competenciesCatalog.length > 0) {
      const list = competenciesCatalog.map((c) => `- id: ${c.id} | Name: "${c.name}"`).join('\n');
      sections.push(`**COMPETENCIES CATALOG (${competenciesCatalog.length}):**\n${list}`);
    } else {
      sections.push('**COMPETENCIES CATALOG: No competencies available.**');
    }

    // Skill levels catalog
    if (skillLevelsCatalog.length > 0) {
      const list = skillLevelsCatalog.map((l) => `- id: ${l.id} | Name: "${l.name}"`).join('\n');
      sections.push(`**SKILL LEVELS CATALOG (${skillLevelsCatalog.length}):**\n${list}`);
    } else {
      sections.push('**SKILL LEVELS CATALOG: No skill levels available.**');
    }

    // Learning objects catalog
    if (programCatalog.length > 0) {
      const list = programCatalog.map((c) =>
        `- id: ${c.id} | Name: "${c.displayName}" | Description: "${c.shortDescription}"${c.image ? ` | Image: "${c.image}"` : ''}`
      ).join('\n');
      sections.push(`**LEARNING OBJECTS CATALOG (${programCatalog.length}):**\n${list}`);
    } else {
      sections.push('**LEARNING OBJECTS CATALOG: No learning objects available.**');
    }

    return `\n\n${sections.join('\n\n')}`;
  }, [programCatalog, positionsCatalog, competenciesCatalog, skillLevelsCatalog]);

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
        const routeData = extractRouteData(response, programCatalog);
        if (routeData) {
          let updatedBannerUrl = routeData.bannerUrl || '';

          // Generate banner image
          if (routeData.banner && routeData.generateBanner && selectedImageProvider && selectedImageModel) {
            setIsGeneratingBanner(true);
            try {
              const { GenerateAndUploadAiImageService } = await import('src/services/ai/GenerateAiImage.service');
              const bannerResult = await GenerateAndUploadAiImageService({
                prompt: routeData.banner,
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

          // Generate video if video provider is selected
          let updatedVideoUrl = routeData.videoUrl || '';
          if (selectedVideoProvider && selectedVideoModel) {
            setIsGeneratingVideo(true);
            try {
              const providerType = getLegacyProviderType(selectedVideoProvider);

              if (providerType === 'proprietary') {
                const { GenerateProprietaryVideoService } = await import('src/services/ai/ProprietaryVideoGeneration.service');
                const sanitizedTitle = (routeData.title || '').replace(/["\\]/g, '');
                const sanitizedDesc = (routeData.description || '').replace(/["\\]/g, '');
                const videoResult = await GenerateProprietaryVideoService({
                  user_prompt: `Create a professional introduction video for the learning path: ${sanitizedTitle}. ${sanitizedDesc}`,
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
                    prompt: `Create a professional introduction video for the learning path: "${routeData.title}". ${routeData.description || ''}`,
                    provider: providerType,
                    seconds: 4,
                    size: '1280x720',
                  },
                  { fileName: `route-video-${Date.now()}.mp4` },
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

          const finalRouteData = {
            ...routeData,
            bannerUrl: updatedBannerUrl,
            videoUrl: updatedVideoUrl,
          };

          onRouteGenerated?.(finalRouteData);
        }
      } catch (e) {
        console.error('Failed to extract route data:', e);
        onError?.(`${t('ai-route-generation.extractError')}: ${e instanceof Error ? e.message : 'Error'}`);
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

    const systemPrompt = ROUTE_GENERATION_SYSTEM_PROMPT + catalogContext;

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
      onError?.(t('ai-route-generation.noProviderSelected'));
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
      topic: t('ai-route-generation.chat.quickPrompts.webDev'),
      description: t('ai-route-generation.chat.quickPrompts.webDevDesc'),
      difficulty: 'beginner',
    },
    {
      topic: t('ai-route-generation.chat.quickPrompts.ai'),
      description: t('ai-route-generation.chat.quickPrompts.aiDesc'),
      difficulty: 'intermediate',
    },
    {
      topic: t('ai-route-generation.chat.quickPrompts.leadership'),
      description: t('ai-route-generation.chat.quickPrompts.leadershipDesc'),
      difficulty: 'advanced',
    },
  ];

  const handleQuickPrompt = (prompt: IAiGenerationPrompt) => {
    setInputValue(t('ai-route-generation.chat.createRouteAbout', { topic: prompt.topic, description: prompt.description || '' }));
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
              <Iconify icon="solar:map-point-bold" width={20} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1">{t('ai-route-generation.chat.title')}</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                <Chip
                  label={selectedProvider?.name || t('ai-route-generation.chat.noProvider')}
                  size="small"
                  variant="soft"
                  color="primary"
                  icon={<Iconify icon="solar:chat-round-dots-bold" width={12} />}
                />
                <Chip
                  label={selectedImageProvider?.name || t('ai-route-generation.chat.noProvider')}
                  size="small"
                  variant="soft"
                  color="success"
                  icon={<Iconify icon="solar:gallery-circle-outline" width={12} />}
                />
                <Chip
                  label={selectedVideoProvider?.name || t('ai-route-generation.chat.noProvider')}
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
                  {t('ai-route-generation.chat.loadingProviders')}
                </Alert>
              )}
              {providersError && (
                <Alert severity="error">
                  {t('ai-route-generation.chat.providersError')}: {providersError}
                </Alert>
              )}

              {/* Program catalog indicator */}
              {isLoadingPrograms || isLoadingCatalogs ? (
                <Alert severity="info" icon={<CircularProgress size={16} />}>
                  {t('ai-route-generation.chat.loadingPrograms')}
                </Alert>
              ) : (
                <Stack spacing={1}>
                  <Alert severity={programCatalog.length > 0 ? 'success' : 'warning'}>
                    {programCatalog.length > 0
                      ? t('ai-route-generation.chat.programsAvailable', { count: programCatalog.length })
                      : t('ai-route-generation.chat.noProgramsFound')}
                  </Alert>
                  <Alert severity={positionsCatalog.length > 0 ? 'success' : 'warning'} variant="outlined">
                    {t('ai-route-generation.chat.catalogLoaded', { name: t('ai-route-generation.chat.positions'), count: positionsCatalog.length })}
                  </Alert>
                  <Alert severity={competenciesCatalog.length > 0 ? 'success' : 'warning'} variant="outlined">
                    {t('ai-route-generation.chat.catalogLoaded', { name: t('ai-route-generation.chat.competencies'), count: competenciesCatalog.length })}
                  </Alert>
                  <Alert severity={skillLevelsCatalog.length > 0 ? 'success' : 'warning'} variant="outlined">
                    {t('ai-route-generation.chat.catalogLoaded', { name: t('ai-route-generation.chat.skillLevels'), count: skillLevelsCatalog.length })}
                  </Alert>
                </Stack>
              )}

              <Divider />

              {/* Language Model Settings */}
              <Typography variant="subtitle2" color="text.secondary">
                {t('ai-route-generation.chat.languageModel')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('ai-route-generation.chat.provider')}</InputLabel>
                  <Select
                    value={selectedProvider?.id || ''}
                    label={t('ai-route-generation.chat.provider')}
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
                  <InputLabel>{t('ai-route-generation.chat.model')}</InputLabel>
                  <Select
                    value={selectedModel?.id || ''}
                    label={t('ai-route-generation.chat.model')}
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
                {t('ai-route-generation.chat.imageModel')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('ai-route-generation.chat.provider')}</InputLabel>
                  <Select
                    value={selectedImageProviderId}
                    label={t('ai-route-generation.chat.provider')}
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
                  <InputLabel>{t('ai-route-generation.chat.model')}</InputLabel>
                  <Select
                    value={selectedImageModelId}
                    label={t('ai-route-generation.chat.model')}
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
                {t('ai-route-generation.chat.videoModel')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('ai-route-generation.chat.provider')}</InputLabel>
                  <Select
                    value={selectedVideoProviderId}
                    label={t('ai-route-generation.chat.provider')}
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
                  <InputLabel>{t('ai-route-generation.chat.model')}</InputLabel>
                  <Select
                    value={selectedVideoModelId}
                    label={t('ai-route-generation.chat.model')}
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
                    {t('ai-route-generation.chat.proprietaryOptions') || 'Opciones Propietarias'}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>{t('ai-route-generation.chat.sceneDuration') || 'Duracion por Escena'}</InputLabel>
                      <Select
                        value={proprietaryDurationScenes}
                        label={t('ai-route-generation.chat.sceneDuration') || 'Duracion por Escena'}
                        onChange={(e) => setProprietaryDurationScenes(Number(e.target.value))}
                      >
                        <MenuItem value={4}>4 {t('ai-route-generation.chat.seconds') || 'segundos'}</MenuItem>
                        <MenuItem value={6}>6 {t('ai-route-generation.chat.seconds') || 'segundos'}</MenuItem>
                        <MenuItem value={12}>12 {t('ai-route-generation.chat.seconds') || 'segundos'}</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      size="small"
                      type="number"
                      label={t('ai-route-generation.chat.scenesNumber') || 'Numero de Escenas'}
                      value={proprietaryScenesNumber}
                      onChange={(e) => setProprietaryScenesNumber(Math.max(1, Math.min(20, Number(e.target.value))))}
                      inputProps={{ min: 1, max: 20 }}
                      sx={{ minWidth: 150 }}
                      helperText={`${t('ai-route-generation.chat.totalDuration') || 'Duracion total'}: ~${proprietaryDurationScenes * proprietaryScenesNumber}s`}
                    />

                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>{t('ai-route-generation.chat.imageModel') || 'Modelo de Imagen'}</InputLabel>
                      <Select
                        value={proprietaryImageModel}
                        label={t('ai-route-generation.chat.imageModel') || 'Modelo de Imagen'}
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
              icon="solar:map-point-bold"
              width={80}
              sx={{ color: 'primary.light', opacity: 0.5 }}
            />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {t('ai-route-generation.chat.welcomeTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                {t('ai-route-generation.chat.welcomeMessage')}
              </Typography>
            </Box>

            {/* Quick Prompts */}
            <Stack spacing={1} sx={{ width: '100%', maxWidth: 500 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('ai-route-generation.chat.quickStart')}
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
              <RouteMessageBubble key={message.id} message={message} />
            ))}

            {isStreaming && fullResponse && (
              <RouteMessageBubble
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
                {t('ai-route-generation.chat.generatingBanner')}
              </Typography>
            </Stack>
          </Box>
        )}

        {isGeneratingVideo && (
          <Box sx={{ px: 2, py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t('ai-route-generation.chat.generatingVideo')}
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
            placeholder={t('ai-route-generation.chat.placeholder')}
            disabled={isStreaming || isGeneratingBanner || isGeneratingVideo}
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
              disabled={!inputValue.trim() || isGeneratingBanner || isGeneratingVideo}
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
// Route Message Bubble Component
// ----------------------------------------------------------------------

type MessageBubbleProps = {
  message: IAiChatMessage;
};

function RouteMessageBubble({ message }: MessageBubbleProps) {
  const { t } = useTranslate('ai');
  const isUser = message.role === 'user';

  const extractJsonData = (content: string): any | null => {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) return JSON.parse(jsonMatch[1]);
      return null;
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
          <Iconify icon="solar:map-point-bold" width={18} />
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
                  {/* Route Title */}
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
                    {jsonData.tags?.map((tag: string, idx: number) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        variant="soft"
                      />
                    ))}
                  </Stack>

                  {/* Modules in the route */}
                  {jsonData.modules?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('ai-route-generation.modulesIncluded', { count: jsonData.modules.length })}
                      </Typography>
                      <Stack spacing={2}>
                        {jsonData.modules.map((mod: any, modIdx: number) => (
                          <Card key={modIdx} variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
                            <Stack spacing={1.5}>
                              {/* Module header */}
                              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                <Chip label={`${t('ai-route-generation.module')} ${modIdx + 1}`} size="small" color="primary" />
                                {mod.competencyName && (
                                  <Chip label={mod.competencyName} size="small" variant="outlined" color="info" />
                                )}
                                {mod.skillLevelName && (
                                  <Chip label={mod.skillLevelName} size="small" variant="soft" color="warning" />
                                )}
                              </Stack>

                              {/* Learning objects in module */}
                              <Stack spacing={1}>
                                {(mod.learningObjects || []).map((lo: any, loIdx: number) => (
                                  <Card key={loIdx} variant="outlined" sx={{ overflow: 'hidden' }}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }}>
                                      {lo.image && (
                                        <Box
                                          component="img"
                                          src={lo.image}
                                          alt={lo.displayName}
                                          sx={{
                                            width: { xs: '100%', sm: 100 },
                                            height: { xs: 120, sm: 'auto' },
                                            objectFit: 'cover',
                                            flexShrink: 0,
                                          }}
                                        />
                                      )}
                                      <Stack spacing={0.5} sx={{ p: { xs: 1, sm: 1.5 }, flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                          <Chip label={loIdx + 1} size="small" color="default" sx={{ flexShrink: 0 }} />
                                          <Typography
                                            variant="subtitle2"
                                            sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' }, lineHeight: 1.4 }}
                                          >
                                            {lo.displayName}
                                          </Typography>
                                          {lo.isOptional && (
                                            <Chip label={t('ai-route-generation.optional')} size="small" variant="soft" color="default" />
                                          )}
                                        </Stack>
                                        {lo.shortDescription && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                              display: '-webkit-box',
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: 'vertical',
                                              overflow: 'hidden',
                                              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                                              lineHeight: 1.5,
                                            }}
                                          >
                                            {lo.shortDescription}
                                          </Typography>
                                        )}
                                      </Stack>
                                    </Stack>
                                  </Card>
                                ))}
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
                      {t('ai-route-generation.chat.routeGeneratedSuccess')}
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
// Helper to extract route data from AI response
// ----------------------------------------------------------------------

function extractRouteData(response: string, catalog: CatalogProgram[]): any | null {
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

    if (jsonText.startsWith('{') || jsonText.startsWith('[')) {
      const parsed = JSON.parse(jsonText);

      if (parsed.title && parsed.modules) {
        // Enrich learning objects with catalog data (image)
        const catalogMap = new Map(catalog.map((c) => [c.id, c]));

        return {
          ...parsed,
          banner: parsed.banner || '',
          bannerUrl: parsed.bannerUrl || '',
          videoUrl: parsed.videoUrl || '',
          positionId: parsed.positionId ? Number(parsed.positionId) : undefined,
          positionName: parsed.positionName || '',
          modules: (parsed.modules || []).map((mod: any, modIdx: number) => ({
            competencyId: Number(mod.competencyId),
            competencyName: mod.competencyName || '',
            skillLevelId: Number(mod.skillLevelId),
            skillLevelName: mod.skillLevelName || '',
            order: mod.order ?? modIdx + 1,
            learningObjects: (mod.learningObjects || []).map((lo: any, loIdx: number) => {
              const catalogItem = catalogMap.get(Number(lo.learningObjectId));
              return {
                learningObjectId: Number(lo.learningObjectId),
                displayName: lo.displayName || catalogItem?.displayName || '',
                shortDescription: lo.shortDescription || catalogItem?.shortDescription || '',
                image: lo.image || catalogItem?.image || '',
                order: lo.order ?? loIdx + 1,
                isOptional: lo.isOptional ?? false,
              };
            }),
          })),
        };
      }
    }

    return null;
  } catch (e) {
    console.error('Failed to extract route data:', e);
    return null;
  }
}
