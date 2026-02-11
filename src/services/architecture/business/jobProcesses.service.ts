import axios, { endpoints } from 'src/utils/axios';

export const SaveJobProcessRelationService = async (payload: any) => {
  const response = await axios.post<any>(endpoints.architecture.business.jobProcesses, payload);
  return response;
};

