import type { JobOrganigramPosition } from 'src/types/organizational-chart-position';
// types
import type {
  IJobKm,
  IJobKmDetail,
  IJobKmPayload,
  IJobKmListResponse,
  ICompetenciesKmListResponse,
} from 'src/types/organization';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

interface GetJobsKmParams {
  page?: number;
  perPage?: number;
  search?: string;
  order?: string;
}

interface GetCompetenciesKmParams {
  page?: number;
  perPage?: number;
  search?: string;
}

// ----------------------------------------------------------------------

export const GetJobsKmService = async (params?: GetJobsKmParams) => {
  const response = await axios.get<IJobKmListResponse>(`${endpoints.organization.jobsKm.all}`, { params });
  return response;
};

export const SaveOrUpdateJobKmService = async (dataSend: IJobKmPayload, id?: number | string) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.organization.jobsKm.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.organization.jobsKm.save, dataSend);
  }
  return response;
};

export const GetJobKmByIdService = async (id: number | string) => {
  const editEndpoint = `${endpoints.organization.jobsKm.edit}/${id}`;
  const response = await axios.get<IJobKm>(editEndpoint);
  return response;
};

export const DeleteJobKmService = async (id: number | string) => {
  const deleteEndpoint = `${endpoints.organization.jobsKm.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

export const GetCompetenciesKmService = async (params?: GetCompetenciesKmParams) => {
  const response = await axios.get<ICompetenciesKmListResponse>(`${endpoints.employees.skills.all}`, { params });
  return response;
};

export const GetJobsKmTreeService = async () => {
  const response = await axios.get<JobOrganigramPosition[]>(`${endpoints.organization.jobsKm.tree}`);
  return response;
};

export const GetJobKmDetailService = async (id: number | string) => {
  const response = await axios.get<IJobKmDetail>(`${endpoints.organization.jobsKm.detail}/${id}/detail`);
  return response;
};

export const CreateJobKmDetailService = async (data: IJobKmPayload) => {
  const response = await axios.post(`${endpoints.organization.jobsKm.createDetail}`, data);
  return response;
};

export const UpdateJobKmDetailService = async (id: number | string, data: IJobKmPayload) => {
  const response = await axios.patch(`${endpoints.organization.jobsKm.detail}/${id}/detail`, data);
  return response;
};
