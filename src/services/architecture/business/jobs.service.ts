// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetJobsPaginationService = async (params: any) => {
  try {
    const response = await axios.get('/api/jobs/all', { params });
    return response;
  } catch (error) {
    console.error('GetJobsPaginationService error:', error);
    throw error;
  }
};

export const GetJobTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.jobTypes.all}`, { params });
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

export const DownloadJobsTemplateService = async (lang: 'es' | 'en') => {
  const response = await axios.get('/api/jobs/download/excel', {
    params: { lang },
    responseType: 'blob',
  });
  return response;
};

export const UploadJobsService = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/api/jobs/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};
