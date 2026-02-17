import axios, { endpoints } from 'src/utils/axios';

export const SaveJobProcessRelationService = async (payload: any) => {
  const response = await axios.post<any>(endpoints.architecture.business.jobProcesses, payload);
  return response;
};

export const UpdateJobProcessRelationService = async (id: number | string, payload: any) => {
  const response = await axios.patch<any>(`${endpoints.architecture.business.jobProcesses}/${id}`, payload);
  return response;
};

export const DeleteJobProcessRelationService = async (id: number | string) => {
  const response = await axios.delete<any>(`${endpoints.architecture.business.jobProcesses}/${id}`);
  return response;
};
