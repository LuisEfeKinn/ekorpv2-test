// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetInfraestructureTablePaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.infrastructure.table.all}`, { params });
  return response;
};

export const SaveOrUpdateInfraestructureTableService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.infrastructure.table.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.infrastructure.table.save, dataSend);
  }
  return response;
};

export const GetInfraestructureTableByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.infrastructure.table.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteInfraestructureTableService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.infrastructure.table.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};