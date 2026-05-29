// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetLearningPathsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.learning.learningPaths.all}`, { params });
  return response;
};

export const SaveOrUpdateLearningPathsService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.learning.learningPaths.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.learning.learningPaths.save, dataSend);
  }
  return response;
};

export const GetLearningPathsByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.learning.learningPaths.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteLearningPathsService = async (id: any) => {
  const deleteEndpoint = `${endpoints.learning.learningPaths.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};
