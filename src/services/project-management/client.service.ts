import axios, { endpoints } from 'src/utils/axios';

export const GetClientsPaginationService = async (params?: {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  order?: string;
}) => {
  const response = await axios.get(endpoints.projectManagement.clients.all, { params });
  return response;
};

export const GetClientByIdService = async (id: string) => {
  const response = await axios.get(`${endpoints.projectManagement.clients.edit}/${id}`);
  return response;
};

export const SaveOrUpdateClientService = async (
  data: { nit: string; name: string; email: string; isActive: boolean },
  id?: string
) => {
  if (id) {
    return axios.patch(`${endpoints.projectManagement.clients.update}/${id}`, data);
  }
  return axios.post(endpoints.projectManagement.clients.save, data);
};

export const DeleteClientService = async (id: string) => {
  const response = await axios.delete(`${endpoints.projectManagement.clients.delete}/${id}`);
  return response;
};
