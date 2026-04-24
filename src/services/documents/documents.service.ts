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
