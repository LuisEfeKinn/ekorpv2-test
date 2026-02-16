// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetLCoursesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.learning.courses.all}`, { params });
  return response;
};

export const SaveOrUpdateCoursesService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.learning.courses.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.learning.courses.save, dataSend);
  }
  return response;
};

export const GetCoursesByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.learning.courses.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteCoursesService = async (id: any) => {
  const deleteEndpoint = `${endpoints.learning.courses.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};


// SELECTS

export const GetCoursesSelectLevelsService = async (params?: any) => {
  const response = await axios.get<any>(`${endpoints.learning.courses.selectSkillLevels}`, { params });
  return response;
}
