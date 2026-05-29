import type { IWorkerUpdatePayload } from 'src/types/project-management';

import axios, { endpoints } from 'src/utils/axios';

export const GetWorkersPaginationService = async (params?: {
  page?: number;
  perPage?: number;
  search?: string;
  workerStatusId?: number;
  employmentTypeId?: number;
  experienceLevelId?: number;
  projectId?: number;
  order?: string;
}) => {
  const response = await axios.get(endpoints.projectManagement.workers.all, { params });
  return response;
};

export const UpdateWorkerService = async (id: string, data: IWorkerUpdatePayload) => {
  const response = await axios.patch(`${endpoints.projectManagement.workers.update}/${id}`, data);
  return response;
};
