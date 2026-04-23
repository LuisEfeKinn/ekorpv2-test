import axios, { endpoints } from 'src/utils/axios';

export type SystemDataRelation = {
  id: number;
  observations?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
  system?: { id: number; name?: string } | null;
  data?: { id: number; name?: string } | null;
  systemId?: number;
  dataId?: number;
  data_id?: number;
};

export type SaveSystemDataRelationPayload = {
  observations?: string;
  system: { id: number };
  data: { id: number };
};

export const GetSystemDataRelationsService = async () =>
  axios.get<SystemDataRelation[]>(endpoints.architecture.data.systemData);

export const GetSystemDataRelationByIdService = async (id: number | string) =>
  axios.get<SystemDataRelation>(`${endpoints.architecture.data.systemData}/${id}`);

export const SaveSystemDataRelationService = async (payload: SaveSystemDataRelationPayload) =>
  axios.post(endpoints.architecture.data.systemData, payload);

export const UpdateSystemDataRelationService = async (id: number | string, payload: SaveSystemDataRelationPayload) =>
  axios.patch(`${endpoints.architecture.data.systemData}/${id}`, payload);

export const DeleteSystemDataRelationService = async (id: number | string) =>
  axios.delete(`${endpoints.architecture.data.systemData}/${id}`);
