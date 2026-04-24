import axios, { endpoints } from 'src/utils/axios';

export type ToolDocumentRelation = {
  id: number;
  observations?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
  tool?: { id: number; name?: string | null; code?: string | null } | null;
  document?: { id: number; name?: string | null; code?: string | null } | null;
  toolId?: number;
  documentId?: number;
};

export type SaveToolDocumentRelationPayload = {
  observations?: string;
  tool: { id: number };
  document: { id: number };
};

export type ToolIndicatorRelation = {
  id: number;
  observations?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
  tool?: { id: number; name?: string | null; code?: string | null } | null;
  indicator?: { id: number; name?: string | null; indicatorName?: string | null; indicatorCode?: string | null } | null;
  toolId?: number;
  indicatorId?: number;
};

export type SaveToolIndicatorRelationPayload = {
  observations?: string;
  tool: { id: number };
  indicator: { id: number };
};

export const SaveToolDocumentRelationService = async (payload: SaveToolDocumentRelationPayload) =>
  axios.post(endpoints.architecture.tools.relations.documents, payload);

export const GetToolDocumentRelationByIdService = async (id: number | string) =>
  axios.get<ToolDocumentRelation>(`${endpoints.architecture.tools.relations.documents}/${id}`);

export const UpdateToolDocumentRelationService = async (id: number | string, payload: SaveToolDocumentRelationPayload) =>
  axios.patch<ToolDocumentRelation>(`${endpoints.architecture.tools.relations.documents}/${id}`, payload);

export const DeleteToolDocumentRelationService = async (id: number | string) =>
  axios.delete<unknown>(`${endpoints.architecture.tools.relations.documents}/${id}`);

export const SaveToolIndicatorRelationService = async (payload: SaveToolIndicatorRelationPayload) =>
  axios.post(endpoints.architecture.tools.relations.indicators, payload);

export const GetToolIndicatorRelationByIdService = async (id: number | string) =>
  axios.get<ToolIndicatorRelation>(`${endpoints.architecture.tools.relations.indicators}/${id}`);

export const UpdateToolIndicatorRelationService = async (id: number | string, payload: SaveToolIndicatorRelationPayload) =>
  axios.patch<ToolIndicatorRelation>(`${endpoints.architecture.tools.relations.indicators}/${id}`, payload);

export const DeleteToolIndicatorRelationService = async (id: number | string) =>
  axios.delete<unknown>(`${endpoints.architecture.tools.relations.indicators}/${id}`);

export const GetDocumentsListService = async (
  params?: Record<string, string | number | boolean | undefined>
) => axios.get(endpoints.architecture.documents.table.allList, { params });

export const GetIndicatorsListService = async (
  params?: Record<string, string | number | boolean | undefined>
) => axios.get(endpoints.architecture.indicators.table.all, { params });
