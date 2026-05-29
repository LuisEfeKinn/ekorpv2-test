import axios, { endpoints } from 'src/utils/axios';

export type DocumentRelationRef = {
  id: number;
};

export type DocumentUpsertFormValues = {
  code: string;
  name: string;
  description: string | null;
  version: number;
  writingDate: string | null;
  expirationDate: string | null;
  type: string | null;
  link: string;
  documentStatusId: number;
  documentTypeId: number;
  authorId?: number;
  verifierId?: number;
};

export type DocumentUser = {
  id: string;
  email: string;
  names: string;
  lastnames: string;
  isActive?: boolean;
  tel?: string;
  documentId?: string;
};

export type DocumentStatus = {
  id: number;
  name: string;
};

export type DocumentType = {
  id: number;
  name: string;
  documentCode?: string;
};

export type DocumentItem = {
  createdBy: string | null;
  createdDate: string;
  lastModifiedBy: string | null;
  lastModifiedDate: string;
  id: number;
  code: string;
  name: string;
  description: string;
  version: number;
  writingDate: string;
  expirationDate: string;
  modificationDate: string;
  file: string;
  type: string;
  link: string;
  originalFile: string;
  ranking: number;
  active: number;
  documentStatus: DocumentStatus | null;
  documentType: DocumentType | null;
  user: DocumentUser | null;
  author: DocumentUser | null;
  verifier: DocumentUser | null;
};

export type DocumentsMeta = {
  page: number;
  perPage: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type DocumentsListResponse = {
  data: DocumentItem[];
  meta: DocumentsMeta;
};

export type DocumentMapNode = {
  id: string | number;
  relationId?: string | number;
  label: string;
  data?: unknown;
  children?: DocumentMapNode[];
};

export type DocumentMapResponse = {
  id: string | number;
  label: string;
  data?: unknown;
  children: DocumentMapNode[];
};

export type GetDocumentsParams = {
  page: number;
  perPage: number;
  search?: string;
  name?: string;
  version?: number;
  status?: number;
  writingDate?: string;
  expirationDate?: string;
};

export const GetDocumentsPaginationService = async (params: GetDocumentsParams) => {
  const { search, name, ...rest } = params;
  const term = (name ?? search ?? '').trim();
  const response = await axios.get<DocumentsListResponse>(endpoints.documents.all, {
    params: {
      ...rest,
      ...(term ? { name: term } : {}),
    },
  });
  return response;
};

export const GetDocumentByIdService = async (id: number | string) => {
  const response = await axios.get<unknown>(`${endpoints.documents.edit}/${id}`);
  return response;
};

export const GetDocumentMapByIdService = async (id: number | string) => {
  const response = await axios.get<DocumentMapResponse>(`/api/documents/map/${id}`);
  return response;
};

export const GetDocumentMapExpandService = async (documentId: number | string, nodeId: string | number) => {
  const response = await axios.get<DocumentMapResponse>(`/api/documents/map/${documentId}/expand/${nodeId}`);
  return response;
};

export type DocumentPreviewResponse = {
  statusCode: number;
  url: string;
};

export const GetDocumentPreviewUrlService = async (id: number | string) => {
  const response = await axios.get<DocumentPreviewResponse>(`${endpoints.documents.all}/${id}/preview`);
  return response;
};

export type DownloadDocumentResult = {
  blob: Blob;
  fileName: string;
};

const normalizeFileName = (raw: string): string => raw.replaceAll('"', '').trim();

const parseFileNameFromContentDisposition = (value: string): string => {
  const parts = value.split(';').map((p) => p.trim());
  const fileNameStar = parts.find((p) => p.toLowerCase().startsWith('filename*='));
  if (fileNameStar) {
    const encoded = fileNameStar.split('=')[1] ?? '';
    const match = encoded.match(/^(?:utf-8''|utf8'')(.+)$/i);
    const data = match?.[1] ?? encoded;
    try {
      return normalizeFileName(decodeURIComponent(data));
    } catch {
      return normalizeFileName(data);
    }
  }

  const fileName = parts.find((p) => p.toLowerCase().startsWith('filename='));
  if (fileName) {
    const raw = fileName.split('=')[1] ?? '';
    return normalizeFileName(raw);
  }

  return '';
};

export const DownloadDocumentService = async (
  id: number | string,
  fallbackFileName: string
): Promise<DownloadDocumentResult> => {
  const response = await axios.get<Blob>(`${endpoints.documents.all}/${id}/download`, {
    responseType: 'blob',
  });

  const contentDisposition = String((response.headers as Record<string, unknown>)?.['content-disposition'] ?? '');
  const headerName = contentDisposition ? parseFileNameFromContentDisposition(contentDisposition) : '';
  const fileName = headerName || fallbackFileName;

  return { blob: response.data, fileName };
};

export type ExportDocumentsExcelParams = Omit<GetDocumentsParams, 'page' | 'perPage' | 'search'> & {
  columns: string;
};

export const ExportDocumentsExcelService = async (
  params: ExportDocumentsExcelParams,
  fallbackFileName: string
): Promise<DownloadDocumentResult> => {
  const response = await axios.get<Blob>('/api/documents/export/excel', {
    responseType: 'blob',
    params,
  });

  const contentDisposition = String((response.headers as Record<string, unknown>)?.['content-disposition'] ?? '');
  const headerName = contentDisposition ? parseFileNameFromContentDisposition(contentDisposition) : '';
  const fileName = headerName || fallbackFileName;

  return { blob: response.data, fileName };
};

export const buildDocumentFormData = (values: DocumentUpsertFormValues, file?: File | null): FormData => {
  const formData = new FormData();

  const appendNullableTextField = (key: string, value: string | null | undefined) => {
    if (value === null || value === undefined) return;
    formData.append(key, value);
  };

  if (file) formData.append('file', file);

  formData.append('code', values.code);
  formData.append('name', values.name);
  appendNullableTextField('description', values.description);
  formData.append('version', String(values.version));
  appendNullableTextField('writingDate', values.writingDate);
  appendNullableTextField('expirationDate', values.expirationDate);
  appendNullableTextField('type', values.type);
  formData.append('link', values.link);
  formData.append('documentStatusId', String(values.documentStatusId));
  formData.append('documentTypeId', String(values.documentTypeId));
  formData.append('authorId', values.authorId ? String(values.authorId) : '');
  formData.append('verifierId', values.verifierId ? String(values.verifierId) : '');

  return formData;
};

export const CreateDocumentService = async (values: DocumentUpsertFormValues, file: File) => {
  const formData = buildDocumentFormData(values, file);
  const response = await axios.post<unknown>(endpoints.documents.save, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

export const UpdateDocumentService = async (
  id: number | string,
  values: DocumentUpsertFormValues,
  file?: File | null
) => {
  const formData = buildDocumentFormData(values, file);
  const response = await axios.patch<unknown>(`${endpoints.documents.update}/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

export const DeleteDocumentService = async (id: number | string) => {
  const response = await axios.delete<unknown>(`${endpoints.documents.delete}/${id}`);
  return response;
};

export type DocumentChangeControlEntityRef = {
  id: number;
};

export type DocumentChangeControlCreatePayload = {
  documentCode: string;
  changeDate: string;
  comments: string;
  numberOfDays: number;
  version: number;
  document: DocumentRelationRef;
  user: DocumentChangeControlEntityRef;
  currentStatus: DocumentChangeControlEntityRef;
  previousStatus: DocumentChangeControlEntityRef;
};

export type DocumentChangeControlUser = {
  id?: number | string;
  names?: string;
  lastnames?: string;
  email?: string;
};

export type DocumentChangeControlItem = {
  id: number;
  documentCode: string;
  changeDate: string;
  comments: string;
  numberOfDays: number;
  version: number;
  createdBy: string | null;
  createdDate: string;
  lastModifiedBy: string | null;
  lastModifiedDate: string;
  document: DocumentItem | null;
  user: DocumentChangeControlUser | null;
  currentStatus: DocumentStatus | null;
  previousStatus: DocumentStatus | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const normalizeDocumentChangeControls = (raw: unknown): DocumentChangeControlItem[] => {
  const root = isRecord(raw) && 'data' in raw ? (raw as Record<string, unknown>).data : raw;

  const listRaw =
    Array.isArray(root) && Array.isArray(root[0])
      ? root[0]
      : Array.isArray(root)
        ? root
        : isRecord(root) && Array.isArray(root.items)
          ? root.items
          : [];

  return (Array.isArray(listRaw) ? listRaw : [])
    .map((it) => {
      if (!isRecord(it)) return null;
      const id = Number(it.id);
      if (!Number.isFinite(id)) return null;

      return {
        id,
        documentCode: String(it.documentCode ?? ''),
        changeDate: String(it.changeDate ?? ''),
        comments: String(it.comments ?? ''),
        numberOfDays: Number(it.numberOfDays ?? 0),
        version: Number(it.version ?? 0),
        createdBy: (it.createdBy as string | null) ?? null,
        createdDate: String(it.createdDate ?? ''),
        lastModifiedBy: (it.lastModifiedBy as string | null) ?? null,
        lastModifiedDate: String(it.lastModifiedDate ?? ''),
        document: (it.document as DocumentItem | null) ?? null,
        user: (it.user as DocumentChangeControlUser | null) ?? null,
        currentStatus: (it.currentStatus as DocumentStatus | null) ?? null,
        previousStatus: (it.previousStatus as DocumentStatus | null) ?? null,
      } satisfies DocumentChangeControlItem;
    })
    .filter((x): x is DocumentChangeControlItem => Boolean(x));
};

export const CreateDocumentChangeControlService = async (payload: DocumentChangeControlCreatePayload) => {
  const response = await axios.post<unknown>('/api/document-change-controls', payload);
  return response;
};

export const GetDocumentChangeControlsByDocumentIdService = async (documentId: number | string) => {
  const response = await axios.get<unknown>(`/api/document-change-controls/document/${documentId}`);
  const items = normalizeDocumentChangeControls(response.data);
  return { response, items };
};

export const DOCUMENT_CREATE_EXAMPLE: DocumentUpsertFormValues = {
  code: 'DOC-CAL-010',
  name: 'Manual de Calidad',
  description: 'Manual general del sistema de gestión de calidad.',
  version: 3,
  writingDate: '2026-01-15',
  expirationDate: '2028-01-15',
  type: 'PDF',
  link: 'https://mi-servidor/documentos/manual_calidad_v3.pdf',
  documentStatusId: 2,
  documentTypeId: 5,
  authorId: 12,
  verifierId: 15,
};

export type TopicItem = {
  id: number;
  name: string;
  superiorTopic: TopicItem | null;
};

export const GetTopicsService = async () => {
  const response = await axios.get<unknown>('/api/topics');
  return response;
};

export type DocumentTopicRelationPayload = {
  document: DocumentRelationRef;
  topic: DocumentRelationRef;
};

export const SaveDocumentTopicRelationService = async (payload: DocumentTopicRelationPayload) => {
  const response = await axios.post<unknown>('/api/document-topics', payload);
  return response;
};

export const UpdateDocumentTopicRelationService = async (id: number | string, payload: DocumentTopicRelationPayload) => {
  const response = await axios.patch<unknown>(`/api/document-topics/${id}`, payload);
  return response;
};

export const GetDocumentTopicRelationByIdService = async (id: number | string) => {
  const response = await axios.get<unknown>(`/api/document-topics/${id}`);
  return response;
};

export const DeleteDocumentTopicRelationService = async (id: number | string) => {
  const response = await axios.delete<unknown>(`/api/document-topics/${id}`);
  return response;
};

export type DocumentUserRelationPayload = {
  observations: string;
  document: DocumentRelationRef;
  user: DocumentRelationRef;
};

export const SaveDocumentUserRelationService = async (payload: DocumentUserRelationPayload) => {
  const response = await axios.post<unknown>('/api/document-users', payload);
  return response;
};

export const UpdateDocumentUserRelationService = async (id: number | string, payload: DocumentUserRelationPayload) => {
  const response = await axios.patch<unknown>(`/api/document-users/${id}`, payload);
  return response;
};

export const GetDocumentUserRelationByIdService = async (id: number | string) => {
  const response = await axios.get<unknown>(`/api/document-users/${id}`);
  return response;
};

export const DeleteDocumentUserRelationService = async (id: number | string) => {
  const response = await axios.delete<unknown>(`/api/document-users/${id}`);
  return response;
};

export type CompetencyItem = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: string | null;
  competencyClass: { id: number; name: string } | null;
};

export const GetCompetenciesService = async () => {
  const response = await axios.get<unknown>('/api/competencies');
  return response;
};

export type DocumentCompetencyRelationPayload = {
  document: DocumentRelationRef;
  competency: DocumentRelationRef;
};

export const SaveDocumentCompetencyRelationService = async (payload: DocumentCompetencyRelationPayload) => {
  const response = await axios.post<unknown>('/api/document-competencies', payload);
  return response;
};

export const UpdateDocumentCompetencyRelationService = async (
  id: number | string,
  payload: DocumentCompetencyRelationPayload
) => {
  const response = await axios.patch<unknown>(`/api/document-competencies/${id}`, payload);
  return response;
};

export const GetDocumentCompetencyRelationByIdService = async (id: number | string) => {
  const response = await axios.get<unknown>(`/api/document-competencies/${id}`);
  return response;
};

export const DeleteDocumentCompetencyRelationService = async (id: number | string) => {
  const response = await axios.delete<unknown>(`/api/document-competencies/${id}`);
  return response;
};

export type EvaluationClarityItem = {
  evaluationId: number;
  date: string;
  assignmentDate: string;
  result: number | null;
  approvedYesNo: string | null;
  pensumYesNo: string | null;
  credits: number | null;
  processType: number | null;
  publicationType: number | null;
  status: number | null;
};

export const GetEvaluationClarityService = async () => {
  const response = await axios.get<unknown>('/api/evaluation-clarity');
  return response;
};

export type DocumentExamRelationPayload = {
  document: DocumentRelationRef;
  evaluation: { evaluationId: number };
};

export const SaveDocumentExamRelationService = async (payload: DocumentExamRelationPayload) => {
  const response = await axios.post<unknown>('/api/document-exams', payload);
  return response;
};

export const UpdateDocumentExamRelationService = async (id: number | string, payload: DocumentExamRelationPayload) => {
  const response = await axios.patch<unknown>(`/api/document-exams/${id}`, payload);
  return response;
};

export const GetDocumentExamRelationByIdService = async (id: number | string) => {
  const response = await axios.get<unknown>(`/api/document-exams/${id}`);
  return response;
};

export const DeleteDocumentExamRelationService = async (id: number | string) => {
  const response = await axios.delete<unknown>(`/api/document-exams/${id}`);
  return response;
};
