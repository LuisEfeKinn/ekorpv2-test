import axios from 'src/utils/axios';

export type TechnologyDataRelation = {
  id: number;
  observations?: string | null;
  technology?: { id: number; name?: string } | null;
  data?: { id: number; name?: string } | null;
  technologyId?: number;
  dataId?: number;
};

export type SaveTechnologyDataRelationPayload = {
  observations: string;
  technology: { id: number };
  data: { id: number };
};

export const GetTechnologyDataRelationsService = () =>
  axios.get<TechnologyDataRelation[]>('/api/technology-data');

export const GetTechnologyDataRelationByIdService = (id: number | string) =>
  axios.get<TechnologyDataRelation>(`/api/technology-data/${id}`);

export const SaveTechnologyDataRelationService = (payload: SaveTechnologyDataRelationPayload) =>
  axios.post('/api/technology-data', payload);

export const UpdateTechnologyDataRelationService = (
  id: number | string,
  payload: SaveTechnologyDataRelationPayload
) => axios.patch(`/api/technology-data/${id}`, payload);

export const DeleteTechnologyDataRelationService = (id: number | string) =>
  axios.delete(`/api/technology-data/${id}`);
