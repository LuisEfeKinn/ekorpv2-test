import type { IProjectCreateUpdatePayload } from 'src/types/project-management';

import axios, { endpoints } from 'src/utils/axios';

export const GetProjectsPaginationService = async (params?: {
  page?: number;
  perPage?: number;
  search?: string;
  statusId?: number;
  clientId?: number;
  importanceLevelId?: number;
  order?: string;
}) => {
  const response = await axios.get(endpoints.projectManagement.projects.all, { params });
  return response;
};

export const GetProjectByIdService = async (id: string, boardId?: number) => {
  const response = await axios.get(`${endpoints.projectManagement.projects.edit}/${id}`, {
    params: boardId ? { boardId } : undefined,
  });
  return response;
};

export const SaveOrUpdateProjectService = async (
  data: IProjectCreateUpdatePayload,
  id?: string
) => {
  if (id) {
    const response = await axios.patch(`${endpoints.projectManagement.projects.update}/${id}`, data);
    return response;
  }
  const response = await axios.post(endpoints.projectManagement.projects.save, data);
  return response;
};

export const UpdateProjectPermissionsService = async (
  id: string,
  data: { restrictActivityVisibility?: boolean; isEditable?: boolean }
) => {
  const response = await axios.patch(`${endpoints.projectManagement.projects.update}/${id}`, data);
  return response;
};

export const DeleteProjectService = async (id: string) => {
  const response = await axios.delete(`${endpoints.projectManagement.projects.delete}/${id}`);
  return response;
};
