// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetRolePermissionsService = async (params: {
  roleId: string | number;
  moduleId: string | number;
}) => {
  const response = await axios.get<any>(endpoints.security.permissions.getByRole, { 
    params 
  });
  return response;
};

export const UpdateRolePermissionService = async (dataSend: {
  roleId: number;
  itemId: number;
  permissionId: number;
}) => {
  const response = await axios.post(endpoints.security.permissions.updateByRole, dataSend);
  return response;
};

export const GetPermissionsRelatedDataService = async (params: {
  roleId: string | number;
}) => {
  const response = await axios.get<any>(endpoints.security.permissions.relatedData, { 
    params 
  });
  return response;
};

export const DeletePermissionService = async (id: string | number) => {
  const deleteEndpoint = `${endpoints.security.permissions.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};