// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetActionTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.actionTypes.all}`, { params });
  return response;
};

export const SaveOrUpdateActionTypeService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.actionTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.actionTypes.save, dataSend);
  }
  return response;
};

export const GetActionTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.actionTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteActionTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.actionTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};