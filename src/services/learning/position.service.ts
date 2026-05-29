// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetPositionPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.learning.positions.all}`, { params });
  return response;
};

export const SaveOrUpdatePositionService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.learning.positions.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.learning.positions.save, dataSend);
  }
  return response;
};

export const GetPositionByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.learning.positions.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeletePositionService = async (id: any) => {
  const deleteEndpoint = `${endpoints.learning.positions.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};
