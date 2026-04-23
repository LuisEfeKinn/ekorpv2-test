import axios, { endpoints } from 'src/utils/axios';

export type SystemTechnologyRelation = {
  id: number;
  observations?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
  system?: { id: number; name?: string } | null;
  technology?: { id: number; name?: string } | null;
  systemId?: number;
  technologyId?: number;
  technology_id?: number;
};

export type SaveSystemTechnologyRelationPayload = {
  observations?: string;
  system: { id: number };
  technology: { id: number };
};

export const GetSystemTechnologyRelationsService = async () =>
  axios.get<SystemTechnologyRelation[]>(endpoints.architecture.infrastructure.systemTechnologies);

export const GetSystemTechnologyRelationByIdService = async (id: number | string) =>
  axios.get<SystemTechnologyRelation>(`${endpoints.architecture.infrastructure.systemTechnologies}/${id}`);

export const SaveSystemTechnologyRelationService = async (payload: SaveSystemTechnologyRelationPayload) =>
  axios.post(endpoints.architecture.infrastructure.systemTechnologies, payload);

export const UpdateSystemTechnologyRelationService = async (
  id: number | string,
  payload: SaveSystemTechnologyRelationPayload
) => axios.patch(`${endpoints.architecture.infrastructure.systemTechnologies}/${id}`, payload);

export const DeleteSystemTechnologyRelationService = async (id: number | string) =>
  axios.delete(`${endpoints.architecture.infrastructure.systemTechnologies}/${id}`);
