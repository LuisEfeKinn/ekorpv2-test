// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetConfigureTestsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.performance.configureTests.all}`, { params });
  return response;
};

export const SaveOrUpdateConfigureTestsService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.performance.configureTests.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    const saveEndpoint = `${endpoints.performance.configureTests.save}`;
    response = await axios.post(saveEndpoint, dataSend);
  }
  return response;
};

export const GetConfigureTestsByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.performance.configureTests.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteConfigureTestsService = async (id: any) => {
  const deleteEndpoint = `${endpoints.performance.configureTests.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};