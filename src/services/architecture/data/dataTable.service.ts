// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetDataTablePaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.data.table.all}`, { params });
  return response;
};

export const SaveOrUpdateDataTableService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.data.table.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.data.table.save, dataSend);
  }
  return response;
};

export const GetDataTableByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.data.table.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteDataTableService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.data.table.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};