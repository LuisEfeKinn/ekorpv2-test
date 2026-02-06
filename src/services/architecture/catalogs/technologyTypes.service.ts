// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetTechnologyTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.technologyTypes.all}`, { params });
  return response;
};

export const SaveOrUpdateTechnologyTypeService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.technologyTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.technologyTypes.save, dataSend);
  }
  return response;
};

export const GetTechnologyTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.technologyTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteTechnologyTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.technologyTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};