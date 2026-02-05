// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetStatesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.assets.states.all}`, { params });
  return response;
};

export const SaveOrUpdateStatesService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.assets.states.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.assets.states.save, dataSend);
  }
  return response;
};

export const GetStatesByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.assets.states.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteStatesService = async (id: any) => {
  const deleteEndpoint = `${endpoints.assets.states.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};