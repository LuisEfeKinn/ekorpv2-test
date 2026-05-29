// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetTopicsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.topics.all}`, { params });
  return response;
};

export const SaveOrUpdateTopicService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.topics.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.topics.save, dataSend);
  }
  return response;
};

export const GetTopicByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.topics.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteTopicService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.topics.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};