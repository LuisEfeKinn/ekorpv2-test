// types
import type { IOrganizationalUnit } from 'src/types/organization';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export interface GetOrganizationalUnitPaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export type OrganizationalUnitListResponse =
  | IOrganizationalUnit[]
  | [IOrganizationalUnit[], number]
  | [[IOrganizationalUnit[]], number];

export const normalizeOrganizationalUnitListResponse = (raw: OrganizationalUnitListResponse): IOrganizationalUnit[] => {
  if (!Array.isArray(raw)) return [];

  const maybeTuple = raw as unknown as [unknown, unknown];

  if (maybeTuple.length === 2 && typeof maybeTuple[1] === 'number') {
    const first = maybeTuple[0];
    if (Array.isArray(first)) {
      if (first.length > 0 && Array.isArray(first[0])) {
        return (first[0] as IOrganizationalUnit[]) ?? [];
      }
      return (first as IOrganizationalUnit[]) ?? [];
    }
    return [];
  }

  return raw as IOrganizationalUnit[];
};

export const GetOrganizationalUnitPaginationService = async (params?: GetOrganizationalUnitPaginationParams) => {
  // Filtrar parámetros undefined/null para enviar solo los necesarios
  const filteredParams = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null)
  );
  
  const response = await axios.get<OrganizationalUnitListResponse>(`${endpoints.organization.organizationalUnits.all}`, { 
    params: filteredParams 
  });
  return response;
};

export const SaveOrUpdateOrganizationalUnitService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.organization.organizationalUnits.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.organization.organizationalUnits.save, dataSend);
  }
  return response;
};

export const GetOrganizationalUnitByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.organization.organizationalUnits.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteOrganizationalUnitService = async (id: any) => {
  const deleteEndpoint = `${endpoints.organization.organizationalUnits.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

export type OrganizationalUnitMapNode = {
  id: string;
  label: string;
  children?: OrganizationalUnitMapNode[];
};

export type OrganizationalUnitMapResponse = OrganizationalUnitMapNode;

export const GetOrganizationalUnitMapByIdService = async (organizationalUnitId: string) => {
  const response = await axios.get<OrganizationalUnitMapResponse>(
    `${endpoints.organization.organizationalUnits.all}/map/${organizationalUnitId}`
  );
  return response;
};
