import axios, { endpoints } from 'src/utils/axios';

export const GetToolsListService = async () => {
  const response = await axios.get<any>(endpoints.architecture.tools.table.all);
  return response;
};

export const SaveToolRiskRelationService = async (payload: any) => {
  const response = await axios.post<any>(endpoints.architecture.risk.toolRisks, payload);
  return response;
};

export const GetToolRisksService = async () => {
  const response = await axios.get<any>(endpoints.architecture.risk.toolRisks);
  return response;
};

export const GetToolRiskRelationByIdService = async (id: number | string) => {
  const response = await axios.get<any>(`${endpoints.architecture.risk.toolRisks}/${id}`);
  return response;
};

export const UpdateToolRiskRelationService = async (id: number | string, payload: any) => {
  const response = await axios.patch<any>(`${endpoints.architecture.risk.toolRisks}/${id}`, payload);
  return response;
};

export const DeleteToolRiskRelationService = async (id: number | string) => {
  const response = await axios.delete<any>(`${endpoints.architecture.risk.toolRisks}/${id}`);
  return response;
};
