// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetAIModelsSettingsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.ai.models.all}`, { params });
  return response;
};

export const SaveOrUpdateAIModelSettingService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.ai.models.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.ai.models.save, dataSend);
  }
  return response;
};

export const GetAIModelSettingByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.ai.models.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteAIModelSettingService = async (id: any) => {
  const deleteEndpoint = `${endpoints.ai.models.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};