import axios from 'src/utils/axios';

export type DataDocumentRelation = {
  id: number;
  observations?: string | null;
  document?: { id: number; name?: string } | null;
  data?: { id: number; name?: string } | null;
};

export type SaveDataDocumentRelationPayload = {
  observations: string;
  document: { id: number };
  data: { id: number };
};

export const GetDataDocumentRelationsService = () =>
  axios.get<DataDocumentRelation[]>('/api/data-documents');

export const GetDataDocumentRelationByIdService = (id: number | string) =>
  axios.get<DataDocumentRelation>(`/api/data-documents/${id}`);

export const SaveDataDocumentRelationService = (payload: SaveDataDocumentRelationPayload) =>
  axios.post('/api/data-documents', payload);

export const UpdateDataDocumentRelationService = (
  id: number | string,
  payload: SaveDataDocumentRelationPayload
) => axios.patch(`/api/data-documents/${id}`, payload);

export const DeleteDataDocumentRelationService = (id: number | string) =>
  axios.delete(`/api/data-documents/${id}`);
