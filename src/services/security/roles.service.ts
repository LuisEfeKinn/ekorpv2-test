// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetRolesPaginationService = async (params?: any) => {
  const response = await axios.get<any>(`${endpoints.security.roles.all}`, { params });
  return response;
};

export const SaveOrUpdateRolesService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.security.roles.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.security.roles.save, dataSend);
  }
  return response;
};

export const GetRolesByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.security.roles.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteRoleService = async (id: any) => {
  const deleteEndpoint = `${endpoints.security.roles.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};