import axios, { endpoints } from 'src/utils/axios';

export const SaveRiskJobRelationService = async (payload: any) => {
  const response = await axios.post<any>(endpoints.architecture.business.risks.relationSave, payload);
  return response;
};

export const GetJobsListService = async () => {
  const response = await axios.get<any>(endpoints.architecture.business.jobs.all);
  return response;
};

export const GetProcessesListService = async () => {
  const response = await axios.get<any>(endpoints.architecture.process.table.all);
  return response;
};

export const SaveProcessRiskRelationService = async (payload: any) => {
  const response = await axios.post<any>(endpoints.architecture.risk.processRisks, payload);
  return response;
};

export const UpdateProcessRiskRelationService = async (id: number | string, payload: any) => {
  const response = await axios.patch<any>(`${endpoints.architecture.risk.processRisks}/${id}`, payload);
  return response;
};

export const GetProcessRiskRelationByIdService = async (id: number | string) => {
  const response = await axios.get<any>(`${endpoints.architecture.risk.processRisks}/${id}`);
  return response;
};

export const DeleteProcessRiskRelationService = async (id: number | string) => {
  const response = await axios.delete<any>(`${endpoints.architecture.risk.processRisks}/${id}`);
  return response;
};

export const GetProcessRisksService = async () => {
  const response = await axios.get<any>(endpoints.architecture.risk.processRisks);
  return response;
};
