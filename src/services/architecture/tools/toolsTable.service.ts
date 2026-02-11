// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetToolsTablePaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.tools.table.all}`, { params });
  return response;
};

export const SaveOrUpdateToolsTableService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.tools.table.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.tools.table.save, dataSend);
  }
  return response;
};

export const GetToolsTableByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.tools.table.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteToolsTableService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.tools.table.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

// ----------------------------------------------------------------------

export const GetRiskTypesService = async () => {
  const response = await axios.get(endpoints.architecture.risk.table.types);
  return response;
}