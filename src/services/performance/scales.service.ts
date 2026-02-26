// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetScalesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.performance.scales.all}`, { params });
  return response;
};

export const SaveOrUpdateScaleService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.performance.scales.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.performance.scales.save, dataSend);
  }
  return response;
};

export const GetScaleByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.performance.scales.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteScaleService = async (id: any) => {
  const deleteEndpoint = `${endpoints.performance.scales.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};