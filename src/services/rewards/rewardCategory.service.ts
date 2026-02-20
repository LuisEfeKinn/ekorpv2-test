// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetRewardCategoryPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.rewards.category.all}`, { params });
  return response;
};

export const SaveOrUpdateRewardCategoryService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.rewards.category.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.rewards.category.save, dataSend);
  }
  return response;
};

export const GetRewardCategoryByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.rewards.category.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteRewardCategoryService = async (id: any) => {
  const deleteEndpoint = `${endpoints.rewards.category.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};
