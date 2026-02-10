// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetLearningObjectsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.learning.learningObjects.all}`, { params });
  return response;
};

export const SaveOrUpdateLearningObjectsService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.learning.learningObjects.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.learning.learningObjects.save, dataSend);
  }
  return response;
};

export const GetLearningObjectsByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.learning.learningObjects.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteLearningObjectsService = async (id: any) => {
  const deleteEndpoint = `${endpoints.learning.learningObjects.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};


// SELECTS

export const GetLearningObjectsSelectCategoriesService = async (params?: any) => {
  const response = await axios.get<any>(`${endpoints.learning.learningObjects.selectCategories}`, { params });
  return response;
}

export const GetLearningObjectsSelectLevelsService = async (params?: any) => {
  const response = await axios.get<any>(`${endpoints.learning.learningObjects.selectLevels}`, { params });
  return response;
}

export const GetLearningObjectsSelectCoursesService = async (params?: any) => {
  const response = await axios.get<any>(`${endpoints.learning.learningObjects.selectCourses}`, { params });
  return response;
}

