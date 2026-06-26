import type { IBoardColumnCreatePayload, IBoardColumnUpdatePayload } from 'src/types/project-management';

import axios, { endpoints } from 'src/utils/axios';

const { boards } = endpoints.projectManagement;

export const GetBoardsService = async (projectId: number) => {
  const response = await axios.get(boards.all, { params: { projectId } });
  return response;
};

export const CreateBoardService = async (data: { projectId: number; name: string }) => {
  const response = await axios.post(boards.all, data);
  return response;
};

export const UpdateBoardService = async (id: number, data: { name: string }) => {
  const response = await axios.patch(`${boards.all}/${id}`, data);
  return response;
};

export const DeleteBoardService = async (id: number) => {
  const response = await axios.delete(`${boards.all}/${id}`);
  return response;
};

export const GetBoardColumnsService = async (boardId: number) => {
  const response = await axios.get(boards.columns, { params: { boardId } });
  return response;
};

export const CreateBoardColumnService = async (data: IBoardColumnCreatePayload) => {
  const response = await axios.post(boards.columns, data);
  return response;
};

export const UpdateBoardColumnService = async (id: number, data: IBoardColumnUpdatePayload) => {
  const response = await axios.patch(`${boards.columns}/${id}`, data);
  return response;
};

export const ReorderBoardColumnsService = async (columns: { id: number; order: number }[]) => {
  const response = await axios.patch(boards.columnsReorder, { columns });
  return response;
};

export const DeleteBoardColumnService = async (id: number) => {
  const response = await axios.delete(`${boards.columns}/${id}`);
  return response;
};
