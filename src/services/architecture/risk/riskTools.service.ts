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
