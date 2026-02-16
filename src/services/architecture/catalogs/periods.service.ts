
// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetPeriodsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.periods.all}`, { params });
  return response;
};

export const SaveOrUpdatePeriodService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.periods.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.periods.save, dataSend);
  }
  return response;
};

export const GetPeriodByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.periods.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeletePeriodService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.periods.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};
