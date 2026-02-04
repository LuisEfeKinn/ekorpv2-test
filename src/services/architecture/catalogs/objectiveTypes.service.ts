// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetObjectiveTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.objectiveTypes.all}`, { params });
  return response;
};

export const SaveOrUpdateObjectiveTypeService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.objectiveTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.objectiveTypes.save, dataSend);
  }
  return response;
};

export const GetObjectiveTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.objectiveTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteObjectiveTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.objectiveTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};