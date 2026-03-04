// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetCompetenciesClassesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.competenciesClasses.all}`, { params });
  return response;
};

export const SaveOrUpdateCompetenciesClassesService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.competenciesClasses.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.competenciesClasses.save, dataSend);
  }
  return response;
};

export const GetCompetenciesClassesByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.competenciesClasses.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteCompetenciesClassesService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.competenciesClasses.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};