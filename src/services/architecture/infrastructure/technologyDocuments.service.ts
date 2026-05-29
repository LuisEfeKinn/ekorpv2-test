import axios from 'src/utils/axios';

export type TechnologyDocumentRelation = {
  id: number;
  observations?: string | null;
  document?: { id: number; name?: string } | null;
  technology?: { id: number; name?: string } | null;
};

export type SaveTechnologyDocumentRelationPayload = {
  observations: string;
  document: { id: number };
  technology: { id: number };
};

export const GetTechnologyDocumentRelationsService = () =>
  axios.get<TechnologyDocumentRelation[]>('/api/technology-documents');

export const GetTechnologyDocumentRelationByIdService = (id: number | string) =>
  axios.get<TechnologyDocumentRelation>(`/api/technology-documents/${id}`);

export const SaveTechnologyDocumentRelationService = (
  payload: SaveTechnologyDocumentRelationPayload
) => axios.post('/api/technology-documents', payload);

export const UpdateTechnologyDocumentRelationService = (
  id: number | string,
  payload: SaveTechnologyDocumentRelationPayload
) => axios.patch(`/api/technology-documents/${id}`, payload);

export const DeleteTechnologyDocumentRelationService = (id: number | string) =>
  axios.delete(`/api/technology-documents/${id}`);
