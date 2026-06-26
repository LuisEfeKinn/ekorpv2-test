import type { IActivityMovePayload, IActivityCreatePayload } from 'src/types/project-management';

import axios, { endpoints } from 'src/utils/axios';

const { activities } = endpoints.projectManagement;

export const GetActivitiesListService = async (params?: {
  projectId?: number;
  statusId?: number;
  employerId?: number;
  search?: string;
  onlyRoot?: boolean;
  page?: number;
  perPage?: number;
  order?: string;
}) => {
  const response = await axios.get(activities.all, { params });
  return response;
};

export const GetActivitiesKanbanService = async (boardId: string) => {
  const response = await axios.get(activities.kanban, { params: { boardId, onlyRoot: true } });
  return response;
};

export const GetActivityByIdService = async (id: string) => {
  const response = await axios.get(`${activities.all}/${id}`);
  return response;
};

export const CreateActivityService = async (data: IActivityCreatePayload) => {
  const response = await axios.post(activities.all, data);
  return response;
};

export const UpdateActivityService = async (id: string, data: Partial<IActivityCreatePayload>) => {
  const response = await axios.patch(`${activities.all}/${id}`, data);
  return response;
};

export const MoveActivityKanbanService = async (id: string, data: IActivityMovePayload) => {
  const response = await axios.patch(`${activities.move}/${id}/kanban`, data);
  return response;
};

export const DeleteActivityService = async (id: string) => {
  const response = await axios.delete(`${activities.all}/${id}`);
  return response;
};
