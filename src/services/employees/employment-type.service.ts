// types
import type { IEmploymentTypesResponse } from 'src/types/employees';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------


// Interface for Employment Type pagination service parameters
interface GetTypeEmploymentPaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export const GetTypeEmploymentPaginationService = async (params?: GetTypeEmploymentPaginationParams) => {
  // Filter out undefined values to avoid sending empty parameters
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  ) : undefined;

  const response = await axios.get<IEmploymentTypesResponse>(`${endpoints.employees.employeesTypes.all}`, { 
    params: filteredParams 
  });
  return response;
};

export const SaveOrUpdateTypeEmploymentService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.employees.employeesTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.employees.employeesTypes.save, dataSend);
  }
  return response;
};

export const GetTypeEmploymentByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.employees.employeesTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteTypeEmploymentService = async (id: any) => {
  const deleteEndpoint = `${endpoints.employees.employeesTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

