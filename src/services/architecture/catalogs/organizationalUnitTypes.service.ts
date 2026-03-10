// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetOrganizationalUnitTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.organizationalUnitTypes.all}`, { params });
  return response;
};

export const SaveOrUpdateOrganizationalUnitTypeService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.organizationalUnitTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.organizationalUnitTypes.save, dataSend);
  }
  return response;
};

export const GetOrganizationalUnitTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.organizationalUnitTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteOrganizationalUnitTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.organizationalUnitTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};