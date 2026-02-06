// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetObjectivesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.business.objectives.all}`, { params });
  return response;
};

export const SaveOrUpdateObjectivesService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.business.objectives.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.business.objectives.save, dataSend);
  }
  return response;
};

export const GetObjectivesByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.business.objectives.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteObjectivesService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.business.objectives.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

export const GetObjectivesMapByIdService = async (id: string) => {
  const response = await axios.get<any>(`${endpoints.architecture.business.objectives.all}/map/${id}`);
  return response;
};

export const GetObjectivesMapByIdExpandService = async (id: string, nodeId: string) => {
  const response = await axios.get<any>(`${endpoints.architecture.business.objectives.all}/map/${id}/expand/${nodeId}`);
  return response;
};
