import axios, { endpoints } from 'src/utils/axios';

const { workers } = endpoints.projectManagement;

export const GetMyProjectsService = async (params?: {
  page?: number;
  perPage?: number;
  search?: string;
  order?: string;
}) => {
  const response = await axios.get(workers.myProjects, { params });
  return response;
};

export const GetMyActivitiesKanbanService = async (projectId: string) => {
  const response = await axios.get(workers.myActivitiesKanban, {
    params: { projectId, onlyRoot: true },
  });
  return response;
};
