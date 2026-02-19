// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetNineBoxSettingsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.performance.nineBoxSettings.all}`, { params });
  return response;
};

export const SaveNineBoxSettingsService = async (dataSend: any, boxNumber: string) => {
  const updateEndpoint = `${endpoints.performance.nineBoxSettings.save}/${boxNumber}`;
  const response = await axios.patch(updateEndpoint, dataSend);
  return response;
};

export const DeleteNineBoxSettingsService = async (id: string) => {
  const deleteEndpoint = `${endpoints.performance.nineBoxSettings.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};