// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetMeasureActionTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.measureActionTypes.all}`, { params });
  return response;
};

export const SaveOrUpdateMeasureActionTypeService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.measureActionTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.measureActionTypes.save, dataSend);
  }
  return response;
};

export const GetMeasureActionTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.measureActionTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteMeasureActionTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.measureActionTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};