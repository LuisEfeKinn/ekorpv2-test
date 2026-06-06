import axios, { endpoints } from 'src/utils/axios';

export const GetDashboardService = async () => {
  const response = await axios.get(endpoints.projectManagement.dashboard);
  return response;
};
