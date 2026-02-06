// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetRedemptionAllHistoryService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.rewards.redemption.history}`, { params });
  return response;
};

export const GetRedemptionEmployeeHistoryService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.rewards.redemption.employeeHistory}`, { params });
  return response;
};

export const CreateRedemptionService = async (dataSend: any) => {
  const response = await axios.post(endpoints.rewards.redemption.create, dataSend);
  return response;
};
