import axios from 'src/utils/axios';

export type TechnologyProcessRelation = {
  id: number;
  observations?: string | null;
  process?: { id: number; name?: string } | null;
  technology?: { id: number; name?: string } | null;
};

export type SaveTechnologyProcessRelationPayload = {
  observations?: string;
  process: { id: number };
  technology: { id: number };
};

export const GetTechnologyProcessRelationsService = () =>
  axios.get<TechnologyProcessRelation[]>('/api/technology-processes');

export const GetTechnologyProcessRelationByIdService = (id: number | string) =>
  axios.get<TechnologyProcessRelation>(`/api/technology-processes/${id}`);

export const SaveTechnologyProcessRelationService = (payload: SaveTechnologyProcessRelationPayload) =>
  axios.post('/api/technology-processes', payload);

export const UpdateTechnologyProcessRelationService = (
  id: number | string,
  payload: SaveTechnologyProcessRelationPayload
) => axios.patch(`/api/technology-processes/${id}`, payload);

export const DeleteTechnologyProcessRelationService = (id: number | string) =>
  axios.delete(`/api/technology-processes/${id}`);
