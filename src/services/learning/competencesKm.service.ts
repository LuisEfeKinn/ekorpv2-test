// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetCompetenciesKmPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.learning.competences.all}`, { params });
  return response;
};

export const SaveOrUpdateCompetenciesKmService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.learning.competences.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.learning.competences.save, dataSend);
  }
  return response;
};

export const GetCompetenciesKmByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.learning.competences.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteCompetenciesKmService = async (id: any) => {
  const deleteEndpoint = `${endpoints.learning.competences.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};