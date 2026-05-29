// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetToolTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.toolTypes.all}`, { params });
  return response;
};

export const SaveOrUpdateToolTypeService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.toolTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.toolTypes.save, dataSend);
  }
  return response;
};

export const GetToolTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.toolTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteToolTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.toolTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};