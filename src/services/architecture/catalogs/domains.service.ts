// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetDomainPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.domains.all}`, { params });
  return response;
};

export const SaveOrUpdateDomainService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.domains.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.domains.save, dataSend);
  }
  return response;
};

export const GetDomainByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.domains.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteDomainService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.domains.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};