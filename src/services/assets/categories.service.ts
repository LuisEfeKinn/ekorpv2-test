// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetCategoriesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.assets.categories.all}`, { params });
  return response;
};

export const SaveOrUpdateCategoriesService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.assets.categories.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.assets.categories.save, dataSend);
  }
  return response;
};

export const GetCategoriesByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.assets.categories.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteCategoriesService = async (id: any) => {
  const deleteEndpoint = `${endpoints.assets.categories.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};