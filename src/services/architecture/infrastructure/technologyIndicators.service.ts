import axios from 'src/utils/axios';

export type TechnologyIndicatorRelation = {
  id: number;
  observations?: string | null;
  indicator?: { id: number; name?: string; indicatorName?: string } | null;
  technology?: { id: number; name?: string } | null;
};

export type SaveTechnologyIndicatorRelationPayload = {
  observations?: string;
  creationDate?: string;
  indicator: { id: number };
  technology: { id: number };
};

export const GetTechnologyIndicatorRelationsService = () =>
  axios.get<TechnologyIndicatorRelation[]>('/api/technology-indicators');

export const GetTechnologyIndicatorRelationByIdService = (id: number | string) =>
  axios.get<TechnologyIndicatorRelation>(`/api/technology-indicators/${id}`);

export const SaveTechnologyIndicatorRelationService = (
  payload: SaveTechnologyIndicatorRelationPayload
) => axios.post('/api/technology-indicators', payload);

export const UpdateTechnologyIndicatorRelationService = (
  id: number | string,
  payload: SaveTechnologyIndicatorRelationPayload
) => axios.patch(`/api/technology-indicators/${id}`, payload);

export const DeleteTechnologyIndicatorRelationService = (id: number | string) =>
  axios.delete(`/api/technology-indicators/${id}`);
