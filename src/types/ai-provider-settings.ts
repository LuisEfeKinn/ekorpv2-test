// ----------------------------------------------------------------------
// AI Provider Settings Types
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

/**
 * Parameter for AI Provider
 */
export interface IAiProviderParameter {
  id?: string;
  aiProviderId?: string;
  label: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * AI Provider Setting/Configuration
 */
export interface IAiProviderSetting {
  id: string;
  name: string;
  logo: string | null;
  isActive: boolean;
  isAvailable: boolean;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  parameters: IAiProviderParameter[];
}

/**
 * Filters for AI Provider Settings table
 */
export interface IAiProviderSettingTableFilters {
  name: string;
  status: string;
  order: string;
}

/**
 * API Response for AI Provider Settings list
 */
export interface IAiProviderSettingsResponse {
  statusCode: number;
  message: string;
  data: IAiProviderSetting[];
  meta?: {
    page: number;
    perPage: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

/**
 * API Response for single AI Provider Setting
 */
export interface IAiProviderSettingResponse {
  statusCode: number;
  message: string;
  data: IAiProviderSetting;
}

/**
 * Form data for creating/updating AI Provider Settings
 */
export interface IAiProviderSettingFormData {
  name: string;
  logo?: string;
  isActive: boolean;
  isAvailable: boolean;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
  parameters: {
    label: string;
    value: string;
  }[];
}

/**
 * Pagination params
 */
export interface IAiProviderSettingsPaginationParams {
  id: string;
  name: string;
}

/**
 * Provider option for filter autocomplete
 */
export interface IAiProviderOption {
  id: string;
  name: string;
}

/**
 * Pagination params
 */
export interface IAiProviderSettingsPaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Order options for sorting
 */
export const AI_PROVIDER_SETTINGS_ORDER_OPTIONS = [
  { value: 'ASC', label: 'Ascendente' },
  { value: 'DESC', label: 'Descendente' },
] as const;
