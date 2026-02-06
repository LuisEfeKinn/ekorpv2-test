// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetPerformanceRelatedDataService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.performance.relatedData}`, { params });
  return response;
};