import axios, { endpoints } from 'src/utils/axios';

export type SystemDocumentRelation = {
  id: number;
  observations?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
  system?: { id: number; name?: string } | null;
  document?: { id: number; name?: string } | null;
  systemId?: number;
  documentId?: number;
  document_id?: number;
};

export type SaveSystemDocumentRelationPayload = {
  observations?: string;
  system: { id: number };
  document: { id: number };
};

export const GetSystemDocumentRelationsService = async () =>
  axios.get<SystemDocumentRelation[]>(endpoints.architecture.documents.systemDocuments);

export const GetSystemDocumentRelationByIdService = async (id: number | string) =>
  axios.get<SystemDocumentRelation>(`${endpoints.architecture.documents.systemDocuments}/${id}`);

export const SaveSystemDocumentRelationService = async (payload: SaveSystemDocumentRelationPayload) =>
  axios.post(endpoints.architecture.documents.systemDocuments, payload);

export const UpdateSystemDocumentRelationService = async (
  id: number | string,
  payload: SaveSystemDocumentRelationPayload
) => axios.patch(`${endpoints.architecture.documents.systemDocuments}/${id}`, payload);

export const DeleteSystemDocumentRelationService = async (id: number | string) =>
  axios.delete(`${endpoints.architecture.documents.systemDocuments}/${id}`);
