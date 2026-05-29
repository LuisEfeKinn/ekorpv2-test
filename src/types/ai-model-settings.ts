// ----------------------------------------------------------------------
// AI Model Settings Types
// ----------------------------------------------------------------------

import type { IAiProviderSetting } from './ai-provider-settings';

// ----------------------------------------------------------------------

/**
 * AI Model Setting
 */
export interface IAiModelSetting {
  id: string;
  aiProviderId: string;
  modelKey: string;
  name: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  capabilities: string; // JSON string array like "[\"text\",\"code\"]"
  isDefault: boolean;
  endpoint: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  aiProvider?: IAiProviderSetting;
}

/**
 * Filters for AI Model Settings table
 */
export interface IAiModelSettingTableFilters {
  name: string;
}

/**
 * API Response for AI Model Settings list
 */
export interface IAiModelSettingsResponse {
  statusCode: number;
  message: string;
  data: IAiModelSetting[];
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
 * API Response for single AI Model Setting
 */
export interface IAiModelSettingResponse {
  statusCode: number;
  message: string;
  data: IAiModelSetting;
}

/**
 * Form data for creating/updating AI Model Settings
 */
export interface IAiModelSettingFormData {
  aiProviderId: number;
  modelKey: string;
  name: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  capabilities: string[];
  isDefault: boolean;
  endpoint: string;
}

/**
 * Pagination params for AI Model Settings
 */
export interface IAiModelSettingsPaginationParams {
  page?: number;
  perPage?: number;
  providerId: string;
  search?: string;
}

/**
 * Available capabilities for models
 */
export const AI_MODEL_CAPABILITIES = [
  'text',
  'code',
  'reasoning',
  'image',
  'video',
  'audio',
] as const;

export type AiModelCapability = typeof AI_MODEL_CAPABILITIES[number];
