import type { IUserManagement, IUserManagementFormData } from 'src/types/employees';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetUserManagmentPaginationService = async (params?: any) => {
  // La respuesta de paginación tiene la estructura: { statusCode, data: IUserManagement[], meta: IPaginationMeta, message }
  const response = await axios.get<{
    statusCode: number;
    data: IUserManagement[];
    meta: any;
    message: string;
  }>(`${endpoints.employees.userManagment.all}`, { params });
  return response;
};

export const SaveOrUpdateUserManagmentService = async (dataSend: IUserManagementFormData, id?: string) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.employees.userManagment.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.employees.userManagment.save, dataSend);
  }
  return response;
};

export const GetUserManagmentByIdService = async (id: string) => {
  const editEndpoint = `${endpoints.employees.userManagment.edit}/${id}`;
  // La respuesta incluye todos los campos directamente: firstName, secondName, etc.
  // junto con objetos relacionados: position, skill, coin, paymentsPeriod, typeEmployment, user
  const response = await axios.get<{ data: IUserManagement }>(editEndpoint);
  return response;
}

export const DeleteUserManagmentService = async (id: any) => {
  const deleteEndpoint = `${endpoints.employees.userManagment.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};


// ----------------------------------------------------------------------
// Learning Paths Assignment to User Management

export const GetLearningPathsByUserManagementIdService = async (id: string, data?: any) => {
  const response = await axios.get(`${endpoints.employees.userManagment.learningPaths.all}/${id}/learning-paths`, { params: data });
  return response;
};

export const AssignLearningPathsToUserManagementService = async (id: string, data: any) => {
  const response = await axios.post(`${endpoints.employees.userManagment.learningPaths.assign}/${id}/learning-paths`, data);
  return response;
};

export const RemoveLearningPathsFromUserManagementService = async (id: string) => {
  const response = await axios.delete(`${endpoints.employees.userManagment.learningPaths.delete}/${id}`);
  return response;
};


export const GetLearningPathsForEmployeeIdService = async (id: string, data?: any) => {
  const response = await axios.get(`${endpoints.learning.learningPaths.forEmployee}/${id}`, { params: data });
  return response;
};
