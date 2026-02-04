// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetJobsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.business.jobs.all}`, { params });
  return response;
};

export const SaveOrUpdateJobsService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.business.jobs.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.business.jobs.save, dataSend);
  }
  return response;
};

export const GetJobsByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.business.jobs.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteJobsService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.business.jobs.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

export const GetJobsMapByIdService = async (jobId: string) => {
  const response = await axios.get(`${endpoints.architecture.business.jobs.all}/map/${jobId}`);
  return response;
};

export const GetJobsMapExpandByIdService = async (jobId: string, nodeId: string) => {
  const response = await axios.get(`${endpoints.architecture.business.jobs.all}/map/${jobId}/expand/${nodeId}`);
  return response;
};
