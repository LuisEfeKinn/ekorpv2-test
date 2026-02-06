// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetAIProviderSettingsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.ai.settings.all}`, { params });
  return response;
};

export const SaveOrUpdateAIProviderSettingService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.ai.settings.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.ai.settings.save, dataSend);
  }
  return response;
};

export const GetAIProviderSettingByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.ai.settings.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteAIProviderSettingService = async (id: any) => {
  const deleteEndpoint = `${endpoints.ai.settings.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};