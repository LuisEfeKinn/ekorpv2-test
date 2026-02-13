// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetDateControlsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.dateControls.all}`, { params });
  return response;
};

export const SaveOrUpdateDateControlService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.dateControls.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.dateControls.save, dataSend);
  }
  return response;
};

export const GetDateControlByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.dateControls.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteDateControlService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.dateControls.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};