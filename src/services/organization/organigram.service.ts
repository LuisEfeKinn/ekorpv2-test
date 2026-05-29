// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetJobsOrganigramService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.organization.organigram.jobs}`, { params });
  return response;
};

export const GetOrganizationalOrganigramService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.organization.organigram.organization}`, { params });
  return response;
};