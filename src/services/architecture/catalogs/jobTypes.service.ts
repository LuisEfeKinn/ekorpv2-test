// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetJobTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.jobTypes.all}`, { params });
  return response;
};

export const SaveOrUpdateJobTypeService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.jobTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.jobTypes.save, dataSend);
  }
  return response;
};

export const GetJobTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.jobTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteJobTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.jobTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};