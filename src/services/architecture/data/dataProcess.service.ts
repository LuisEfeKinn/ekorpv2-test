import axios from 'src/utils/axios';

export type DataProcessRelation = {
  id: number;
  observations?: string | null;
  process?: { id: number; name?: string } | null;
  data?: { id: number; name?: string } | null;
};

export type SaveDataProcessRelationPayload = {
  observations?: string;
  process: { id: number };
  data: { id: number };
};

export const GetDataProcessRelationsService = () =>
  axios.get<DataProcessRelation[]>('/api/data-process');

export const GetDataProcessRelationByIdService = (id: number | string) =>
  axios.get<DataProcessRelation>(`/api/data-process/${id}`);

export const SaveDataProcessRelationService = (payload: SaveDataProcessRelationPayload) =>
  axios.post('/api/data-process', payload);

export const UpdateDataProcessRelationService = (
  id: number | string,
  payload: SaveDataProcessRelationPayload
) => axios.patch(`/api/data-process/${id}`, payload);

export const DeleteDataProcessRelationService = (id: number | string) =>
  axios.delete(`/api/data-process/${id}`);
