// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetProcessTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.processTypes.all}`, { params });
  return response;
};

export const SaveOrUpdateProcessTypeService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.processTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.processTypes.save, dataSend);
  }
  return response;
};

export const GetProcessTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.processTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteProcessTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.processTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};