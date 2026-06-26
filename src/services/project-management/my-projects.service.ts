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

export const GetMyActivitiesKanbanService = async (boardId: string) => {
  const response = await axios.get(workers.myActivitiesKanban, {
    params: { boardId, onlyRoot: true },
  });
  return response;
};

export const GetMyBoardsService = async (projectId: number) => {
  const response = await axios.get(workers.myBoards, { params: { projectId } });
  return response;
};
