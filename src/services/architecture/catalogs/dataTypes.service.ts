// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetDataTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.dataTypes.all}`, { params });
  return response;
};

export const SaveOrUpdateDataTypeService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.dataTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.dataTypes.save, dataSend);
  }
  return response;
};

export const GetDataTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.dataTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteDataTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.dataTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};