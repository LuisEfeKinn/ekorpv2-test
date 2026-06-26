import type { IAssignmentCreatePayload, IAssignmentUpdatePayload } from 'src/types/project-management';

import axios, { endpoints } from 'src/utils/axios';

const { assignments } = endpoints.projectManagement;

export const GetAssignmentsPaginationService = async (params?: {
  page?: number;
  perPage?: number;
  search?: string;
  projectId?: number;
  statusId?: number;
  employeeId?: number;
  boardId?: number;
  order?: string;
}) => {
  const response = await axios.get(assignments.all, { params });
  return response;
};

export const GetAssignmentByIdService = async (id: string) => {
  const response = await axios.get(`${assignments.all}/${id}`);
  return response;
};

export const CreateAssignmentService = async (data: IAssignmentCreatePayload) => {
  const response = await axios.post(assignments.save, data);
  return response;
};

export const UpdateAssignmentService = async (id: string, data: IAssignmentUpdatePayload) => {
  const response = await axios.patch(`${assignments.update}/${id}`, data);
  return response;
};

export const DeleteAssignmentService = async (id: string) => {
  const response = await axios.delete(`${assignments.delete}/${id}`);
  return response;
};
