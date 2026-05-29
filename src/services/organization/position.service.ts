// types
import type { IPositionsResponse } from 'src/types/organization';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------


// Interface for Position pagination service parameters
interface GetPositionPaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export const GetPositionPaginationService = async (params?: GetPositionPaginationParams) => {
  // Filter out undefined values to avoid sending empty parameters
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  ) : undefined;

  const response = await axios.get<IPositionsResponse>(`${endpoints.organization.positions.all}`, { 
    params: filteredParams 
  });
  return response;
};

export const SaveOrUpdatePositionService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.organization.positions.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.organization.positions.save, dataSend);
  }
  return response;
};

export const GetPositionByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.organization.positions.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeletePositionService = async (id: any) => {
  const deleteEndpoint = `${endpoints.organization.positions.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

