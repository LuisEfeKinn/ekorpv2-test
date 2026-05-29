export { useParams } from './use-params';

export { useRouter } from './use-router';

// AI Course Generator hooks
export { useAiCourse } from './useAiCourse';

export { usePathname } from './use-pathname';

export { useFileUpload } from './useFileUpload';

export { useAiStreaming } from './useAiStreaming';

export { useSearchParams } from './use-search-params';

// Dynamic AI Streaming (with dynamic config)
export { useAiStreamingDynamic } from './useAiStreamingDynamic';

// Dynamic AI Providers (from backend)
export {
  getProviderByNameSync,
  getLegacyTypeFromName,
  useAiProvidersDynamic,
  getApiRouteForProvider,
  getApiRouteForCapability,
  initializeProvidersCache,
} from './useAiProvidersDynamic';

export type { IAiStreamConfig } from './useAiStreamingDynamic';

export type {
  AiProviderType,
  IAiProviderConfig,
} from './useAiProvidersDynamic';