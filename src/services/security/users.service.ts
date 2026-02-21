import type { IUserClarity, IUserClarityCreatePayload } from 'src/types/users';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetUsersPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.security.users.all}`, { params });
  return response;
};

export const SaveOrUpdateUsersService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.security.users.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.security.users.save, dataSend);
  }
  return response;
};

export const GetUserByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.security.users.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteUserService = async (id: any) => {
  const deleteEndpoint = `${endpoints.security.users.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

export const ChangeUserPasswordService = async (id: any, dataSend: { newPassword: string; oldPassword: string }) => {
  const changePasswordEndpoint = `${endpoints.security.users.changePassword}/${id}/password`;
  const response = await axios.post(changePasswordEndpoint, dataSend);
  return response;
}
export const GetPointsByLoggedUserService = async () => {
  const response = await axios.get(`${endpoints.security.users.pointsByLogged}`);
  return response;
};

export const GetUsersClarityAllService = async () => {
  const response = await axios.get<IUserClarity[]>('/api/users-clarity/all');
  return response;
};

export const CreateUserClarityService = async (payload: IUserClarityCreatePayload) => {
  const response = await axios.post('/api/users-clarity', payload);
  return response;
};
