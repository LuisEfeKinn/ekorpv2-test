// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetApplicationTablePaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.aplications.table.all}`, { params });
  return response;
};

export const SaveOrUpdateApplicationTableService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.aplications.table.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.aplications.table.save, dataSend);
  }
  return response;
};

export const GetApplicationTableByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.aplications.table.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteApplicationTableService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.aplications.table.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};