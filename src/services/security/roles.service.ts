import type { IRoleItemsResponse, IRoleCatalogResponse } from 'src/types/permissions';
// types
import type { IRolePayload, GetRolesParams, IRoleListResponse, IRoleByIdResponse } from 'src/types/roles';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetRolesPaginationService = async (params?: GetRolesParams) => {
  const response = await axios.get<IRoleListResponse>(`${endpoints.security.roles.all}`, { params });
  return response;
};

export const SaveOrUpdateRolesService = async (dataSend: IRolePayload, id?: string) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.security.roles.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.security.roles.save, dataSend);
  }
  return response;
};

export const GetRolesByIdService = async (id: string | number) => {
  const editEndpoint = `${endpoints.security.roles.edit}/${id}`;
  const response = await axios.get<IRoleByIdResponse>(editEndpoint);
  return response;
};

export const DeleteRoleService = async (id: string | number) => {
  const deleteEndpoint = `${endpoints.security.roles.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

export const GetRoleItemsCatalogService = async (scope: 'admin' | 'employee' = 'admin') => {
  const response = await axios.get<IRoleCatalogResponse>(endpoints.security.roles.itemsCatalog, {
    params: { scope },
  });
  return response;
};

export const GetRoleItemsService = async (id: string | number) => {
  const response = await axios.get<IRoleItemsResponse>(`${endpoints.security.roles.items}/${id}/items`);
  return response;
};

export const UpdateRoleItemsService = async (id: string | number, itemIds: number[]) => {
  const response = await axios.patch(`${endpoints.security.roles.items}/${id}/items`, { 
    itemIds: itemIds.map(itemId => Number(itemId)) 
  });
  return response;
};
