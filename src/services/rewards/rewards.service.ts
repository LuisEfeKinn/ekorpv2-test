// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetRewardsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.rewards.all}`, { params });
  return response;
};

export const SaveOrUpdateRewardsService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.rewards.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.rewards.save, dataSend);
  }
  return response;
};

export const GetRewardsByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.rewards.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteRewardsService = async (id: any) => {
  const deleteEndpoint = `${endpoints.rewards.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

export const SaveRewardsRateService = async (dataSend: any) => {
  const response = await axios.post(endpoints.rewards.rate.save, dataSend);
  return response;
};