import type { IUserClarity, IUserClarityRelations, IUserClarityCreatePayload } from 'src/types/users';

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

export const CreateUserClarityService = async (
  payload: IUserClarityCreatePayload & IUserClarityRelations
) => {
  const response = await axios.post('/api/users-clarity', payload);
  return response;
};

export const UpdateUserClarityService = async (
  id: number,
  payload: IUserClarityCreatePayload & IUserClarityRelations
) => {
  const response = await axios.patch(`/api/users-clarity/${id}`, payload);
  return response;
};

export const DeleteUserClarityService = async (id: number) => {
  const response = await axios.delete(`/api/users-clarity/${id}`);
  return response;
};

export const GetUserStateEnumsService = async () => {
  const response = await axios.get<number[]>('/api/users-clarity/enums/user-state');
  return response;
};

export const GetAuthenticationMethodEnumsService = async () => {
  const response = await axios.get<number[]>(
    '/api/users-clarity/enums/authentication-method'
  );
  return response;
};

export const GetLanguageEnumsService = async () => {
  const response = await axios.get<number[]>('/api/users-clarity/enums/language');
  return response;
};

export const GetUsersTypeEnumsService = async () => {
  const response = await axios.get<number[]>('/api/users-clarity/enums/users-type');
  return response;
};

export const GetPersonTypeEnumsService = async () => {
  const response = await axios.get<number[]>('/api/users-clarity/enums/person-type');
  return response;
};

export const GetChangePasswordStateEnumsService = async () => {
  const response = await axios.get<number[]>(
    '/api/users-clarity/enums/change-password-state'
  );
  return response;
};

export const GetGenreEnumsService = async () => {
  const response = await axios.get<string[]>('/api/users-clarity/enums/genre');
  return response;
};

export const GetDocumentTypeEnumsService = async () => {
  const response = await axios.get<string[]>('/api/users-clarity/enums/document-type');
  return response;
};

export const GetGeneralSiNoEnumsService = async () => {
  const response = await axios.get<string[]>('/api/users-clarity/enums/general-si-no');
  return response;
};

export const GetProfilesService = async () => {
  const response = await axios.get<Array<{
    idperfil: number;
    nombreperfil: string;
    codigoperfil: string;
    fechacreacionperfil: string | null;
    fechamodificacionperfil: string | null;
    estadoperfil: number | null;
  }>>('/api/profiles');
  return response;
};

export const GetActiveUsersClarityService = async () => {
  const response = await axios.get<IUserClarity[]>('/api/users-clarity/active');
  return response;
};
