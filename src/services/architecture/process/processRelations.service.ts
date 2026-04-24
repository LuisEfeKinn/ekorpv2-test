import axios, { endpoints } from 'src/utils/axios';

export type ProcessIndicatorRelation = {
  id: number;
  creationDate?: string;
  observations?: string | null;
  process?: { id: number; name?: string };
  indicator?: { id: number; name?: string };
  processId?: number;
  indicatorId?: number;
};

export type SystemProcessRelation = {
  id: number;
  observations?: string | null;
  system?: { id: number; name?: string };
  process?: { id: number; name?: string };
};

export type ProcessDocumentRelation = {
  id: number;
  observations?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
  process?: { id: number; name?: string | null; code?: string | null } | null;
  document?: { id: number; name?: string | null; code?: string | null } | null;
  processId?: number;
  documentId?: number;
};

export type SaveProcessDocumentPayload = {
  observations?: string;
  process: { id: number };
  document: { id: number };
};

export const SaveProcessToolService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.tools, data);
  return response;
};

export const UpdateProcessToolService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.tools}/${id}`, data);
  return response;
};

export const DeleteProcessToolService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.tools}/${id}`);
  return response;
};

export const SaveProcessDocumentService = async (payload: SaveProcessDocumentPayload) =>
  axios.post(endpoints.architecture.process.documents, payload);

export const GetProcessDocumentByIdService = async (id: number | string) => {
  const response = await axios.get<ProcessDocumentRelation>(`${endpoints.architecture.process.documents}/${id}`);
  return response;
};

export const UpdateProcessDocumentService = async (id: number | string, payload: SaveProcessDocumentPayload) =>
  axios.patch(`${endpoints.architecture.process.documents}/${id}`, payload);

export const DeleteProcessDocumentService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.documents}/${id}`);
  return response;
};

export const GetDocumentsListService = async (params?: any) => {
  const response = await axios.get(endpoints.architecture.documents.table.allList, { params });
  return response;
};

export const SaveSystemProcessService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.systems, data);
  return response;
};

export const GetSystemProcessRelationsService = async () => {
  const response = await axios.get<SystemProcessRelation[]>(endpoints.architecture.process.systems);
  return response;
};

export const GetSystemProcessRelationByIdService = async (id: number | string) => {
  const response = await axios.get<SystemProcessRelation>(`${endpoints.architecture.process.systems}/${id}`);
  return response;
};

export const UpdateSystemProcessService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.systems}/${id}`, data);
  return response;
};

export const DeleteSystemProcessService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.systems}/${id}`);
  return response;
};

export const SaveProcessCompetencyService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.competencies, data);
  return response;
};

export const UpdateProcessCompetencyService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.competencies}/${id}`, data);
  return response;
};

export const DeleteProcessCompetencyService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.competencies}/${id}`);
  return response;
};

export const SaveProcessRiskService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.risks, data);
  return response;
};

export const UpdateProcessRiskService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.risks}/${id}`, data);
  return response;
};

export const DeleteProcessRiskService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.risks}/${id}`);
  return response;
};

export const SaveObjectiveProcessService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.objectives, data);
  return response;
};

export const UpdateObjectiveProcessService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.objectives}/${id}`, data);
  return response;
};

export const DeleteObjectiveProcessService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.objectives}/${id}`);
  return response;
};

export const SaveProcessIndicatorService = async (data: any) => {
  const response = await axios.post(endpoints.architecture.process.indicators, data);
  return response;
};

export const UpdateProcessIndicatorService = async (id: number | string, data: any) => {
  const response = await axios.patch(`${endpoints.architecture.process.indicators}/${id}`, data);
  return response;
};

export const DeleteProcessIndicatorService = async (id: number | string) => {
  const response = await axios.delete(`${endpoints.architecture.process.indicators}/${id}`);
  return response;
};

export const GetProcessIndicatorsListService = async (params?: Record<string, string | number | boolean | undefined>) => {
  const response = await axios.get<ProcessIndicatorRelation[]>(endpoints.architecture.process.indicators, { params });
  return response;
};

export const GetProcessIndicatorByIdService = async (id: number | string) => {
  const response = await axios.get<ProcessIndicatorRelation>(`${endpoints.architecture.process.indicators}/${id}`);
  return response;
};

export const GetIndicatorsListService = async (params?: any) => {
  const response = await axios.get(endpoints.architecture.indicators.table.all, { params });
  return response;
};
