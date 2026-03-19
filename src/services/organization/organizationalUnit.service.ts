// types
import type { IOrganizationalUnit } from 'src/types/organization';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export interface GetOrganizationalUnitPaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export type OrganizationalUnitListResponse =
  | IOrganizationalUnit[]
  | [IOrganizationalUnit[], number]
  | [[IOrganizationalUnit[]], number];

export const normalizeOrganizationalUnitListResponse = (raw: OrganizationalUnitListResponse): IOrganizationalUnit[] => {
  if (!Array.isArray(raw)) return [];

  const maybeTuple = raw as unknown as [unknown, unknown];

  if (maybeTuple.length === 2 && typeof maybeTuple[1] === 'number') {
    const first = maybeTuple[0];
    if (Array.isArray(first)) {
      if (first.length > 0 && Array.isArray(first[0])) {
        return (first[0] as IOrganizationalUnit[]) ?? [];
      }
      return (first as IOrganizationalUnit[]) ?? [];
    }
    return [];
  }

  return raw as IOrganizationalUnit[];
};

export const GetOrganizationalUnitPaginationService = async (params?: GetOrganizationalUnitPaginationParams) => {
  // Filtrar parámetros undefined/null para enviar solo los necesarios
  const filteredParams = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null)
  );
  
  const response = await axios.get<OrganizationalUnitListResponse>(`${endpoints.organization.organizationalUnits.all}`, { 
    params: filteredParams 
  });
  return response;
};

export const SaveOrUpdateOrganizationalUnitService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.organization.organizationalUnits.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.organization.organizationalUnits.save, dataSend);
  }
  return response;
};

export const GetOrganizationalUnitByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.organization.organizationalUnits.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteOrganizationalUnitService = async (id: any) => {
  const deleteEndpoint = `${endpoints.organization.organizationalUnits.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

export type OrganizationalUnitFlowNode = {
  id: string;
  label: string;
  data: IOrganizationalUnit;
  children?: OrganizationalUnitFlowNode[];
};

export const GetOrganizationalUnitFlowService = async (params?: Record<string, string | number | boolean | undefined>) => {
  const response = await axios.get<OrganizationalUnitFlowNode[]>('/api/organizational-unit/flow', {
    params,
  });
  return response;
};

export type OrganizationalUnitMapNode = {
  id: string;
  label: string;
  children?: OrganizationalUnitMapNode[];
};

export type OrganizationalUnitMapResponse = OrganizationalUnitMapNode;

export const GetOrganizationalUnitMapByIdService = async (organizationalUnitId: string) => {
  const response = await axios.get<OrganizationalUnitMapResponse>(
    `${endpoints.organization.organizationalUnits.all}/map/${organizationalUnitId}`
  );
  return response;
};

export const GetOrganizationalUnitMapExpandByIdService = async (organizationalUnitId: string, nodeId: string) => {
  const response = await axios.get<OrganizationalUnitMapResponse>(
    `${endpoints.organization.organizationalUnits.all}/map/${organizationalUnitId}/expand/${nodeId}`
  );
  return response;
};

export const SaveOrganizationalUnitRelationService = async (data: {
  nombre: string;
  nombreReversa: string;
  organizationalUnit1: { id: number };
  organizationalUnit2: { id: number };
}) => {
  const response = await axios.post('/api/organizational-unit/relations', data);
  return response;
};

export type OrganizationalUnitSummary = {
  id: string | number;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  color?: string | null;
  expectedResults?: string | null;
};

export type OrganizationalUnitRelation = {
  id: number;
  nombre: string;
  nombreReversa: string;
  organizationalUnit1: OrganizationalUnitSummary;
  organizationalUnit2: OrganizationalUnitSummary;
  createdDate?: string;
  lastModifiedDate?: string;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
};

export const GetOrganizationalUnitRelationByIdService = async (id: number | string) => {
  const response = await axios.get<{ statusCode?: number; data?: OrganizationalUnitRelation }>(
    `/api/organizational-unit/relations/${id}`
  );
  return response;
};

export const UpdateOrganizationalUnitRelationService = async (
  id: number | string,
  data: {
    nombre?: string;
    nombreReversa?: string;
    organizationalUnit1?: { id: number };
    organizationalUnit2?: { id: number };
  }
) => {
  const response = await axios.patch(`/api/organizational-unit/relations/${id}`, data);
  return response;
};

export const DeleteOrganizationalUnitRelationService = async (id: number | string) => {
  const response = await axios.delete(`/api/organizational-unit/relations/${id}`);
  return response;
};

export type DocumentSummary = {
  id: number | string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  version?: number | null;
  writingDate?: string | null;
  expirationDate?: string | null;
  modificationDate?: string | null;
  file?: string | null;
  type?: string | null;
  link?: string | null;
  originalFile?: string | null;
  ranking?: number | null;
  active?: boolean | null;
};

export type OrganizationalUnitDocumentRelation = {
  id: number;
  observations: string;
  organizationalUnit: OrganizationalUnitSummary;
  document: DocumentSummary;
  createdDate?: string;
  lastModifiedDate?: string;
  createdBy?: string | null;
  lastModifiedBy?: string | null;
};

export const SaveOrganizationalUnitDocumentService = async (data: {
  observations: string;
  organizationalUnit: { id: number };
  document: { id: number };
}) => {
  const response = await axios.post('/api/organizational-unit/documents', data);
  return response;
};

export const GetOrganizationalUnitDocumentByIdService = async (id: number | string) => {
  const response = await axios.get<{ statusCode?: number; data?: OrganizationalUnitDocumentRelation }>(
    `/api/organizational-unit/documents/${id}`
  );
  return response;
};

export const UpdateOrganizationalUnitDocumentService = async (
  id: number | string,
  data: {
    observations?: string;
    organizationalUnit?: { id: number };
    document?: { id: number };
  }
) => {
  const response = await axios.patch(`/api/organizational-unit/documents/${id}`, data);
  return response;
};

export const DeleteOrganizationalUnitDocumentService = async (id: number | string) => {
  const response = await axios.delete(`/api/organizational-unit/documents/${id}`);
  return response;
};

export const DownloadOrganizationalUnitTemplateService = async () => {
  const response = await axios.get('/api/organizational-unit/download/template', {
    responseType: 'blob',
  });
  return response;
};

export const DownloadOrganizationalUnitExcelService = async (params?: any) => {
  const response = await axios.get('/api/organizational-unit/download/excel', {
    responseType: 'blob',
    params,
  });
  return response;
};

export const UploadOrganizationalUnitService = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${endpoints.organization.organizationalUnits.all}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};
