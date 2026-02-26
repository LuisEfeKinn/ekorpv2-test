import axios, { endpoints } from 'src/utils/axios';

export const GetRiskFlowService = async (params?: any) => {
  const response = await axios.get<any>(endpoints.architecture.risk.flow.all, { params });
  return response;
};

export const GetRiskFlowByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.risk.flow.byId}/${id}`);
  return response;
};

