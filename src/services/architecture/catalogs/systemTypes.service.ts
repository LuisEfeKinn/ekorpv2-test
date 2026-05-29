// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetSystemTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.systemTypes.all}`, { params });
  return response;
};

export const SaveOrUpdateSystemTypeService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.systemTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.systemTypes.save, dataSend);
  }
  return response;
};

export const GetSystemTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.systemTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteSystemTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.systemTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};