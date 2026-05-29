// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetProvidersPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.providers.all}`, { params });
  return response;
};

export const SaveOrUpdateProviderService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.providers.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.providers.save, dataSend);
  }
  return response;
};

export const GetProviderByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.providers.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteProviderService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.providers.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};