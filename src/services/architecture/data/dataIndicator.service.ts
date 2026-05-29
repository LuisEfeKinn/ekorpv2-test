import axios from 'src/utils/axios';

export type DataIndicatorRelation = {
  id: number;
  observations?: string | null;
  indicator?: { id: number; name?: string; indicatorName?: string } | null;
  data?: { id: number; name?: string } | null;
};

export type SaveDataIndicatorRelationPayload = {
  observations?: string;
  indicator: { id: number };
  data: { id: number };
};

export const GetDataIndicatorRelationsService = () =>
  axios.get<DataIndicatorRelation[]>('/api/data-indicator');

export const GetDataIndicatorRelationByIdService = (id: number | string) =>
  axios.get<DataIndicatorRelation>(`/api/data-indicator/${id}`);

export const SaveDataIndicatorRelationService = (payload: SaveDataIndicatorRelationPayload) =>
  axios.post('/api/data-indicator', payload);

export const UpdateDataIndicatorRelationService = (
  id: number | string,
  payload: SaveDataIndicatorRelationPayload
) => axios.patch(`/api/data-indicator/${id}`, payload);

export const DeleteDataIndicatorRelationService = (id: number | string) =>
  axios.delete(`/api/data-indicator/${id}`);
