import axios, { endpoints } from 'src/utils/axios';

export const GetJobsKmService = async (params?: {
  page?: number;
  perPage?: number;
  search?: string;
  order?: string;
}) => {
  const response = await axios.get(endpoints.jobsKm.all, { params });
  return response;
};
