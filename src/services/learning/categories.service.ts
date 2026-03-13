// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetLearningCategoriesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.learning.learningCategories.all}`, { params });
  return response;
};

export const SaveOrUpdateLearningCategoriesService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.learning.learningCategories.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.learning.learningCategories.save, dataSend);
  }
  return response;
};

export const GetLearningCategoriesByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.learning.learningCategories.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteLearningCategoriesService = async (id: any) => {
  const deleteEndpoint = `${endpoints.learning.learningCategories.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};