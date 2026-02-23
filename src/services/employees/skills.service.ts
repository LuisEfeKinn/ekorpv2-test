// types
import type { ISkillsResponse } from 'src/types/employees';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export interface GetSkillsPaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export const GetSkillsPaginationService = async (params?: GetSkillsPaginationParams) => {
  // Filtrar parámetros undefined/null para enviar solo los necesarios
  const filteredParams = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null)
  );
  
  const response = await axios.get<ISkillsResponse>(`${endpoints.employees.skills.all}`, { 
    params: filteredParams 
  });
  return response;
};

export const SaveOrUpdateSkillsService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.employees.skills.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.employees.skills.save, dataSend);
  }
  return response;
};

export const GetSkillsByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.employees.skills.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteSkillsService = async (id: any) => {
  const deleteEndpoint = `${endpoints.employees.skills.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

