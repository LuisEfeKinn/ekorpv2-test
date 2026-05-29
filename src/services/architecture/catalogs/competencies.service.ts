// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetCompetenciesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.competencies.all}`, { params });
  return response;
};

export const SaveOrUpdateCompetenciesService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.competencies.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.competencies.save, dataSend);
  }
  return response;
};

export const GetCompetenciesByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.competencies.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteCompetenciesService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.competencies.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};