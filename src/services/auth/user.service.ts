import type { IUserProfile, IUserProfileUpdate } from 'src/types/user-profile';

import axios, { endpoints } from 'src/utils/axios';
// ----------------------------------------------------------------------

export const GetUserProfileService = async (params?: Record<string, unknown>) => {
  const response = await axios.get<{ statusCode: number; data: IUserProfile; message: string }>(
    `${endpoints.auth.user.profile}`,
    { params }
  );
  return response;
};

export const UpdateUserProfileService = async (dataSend: IUserProfileUpdate) => {
  const response = await axios.patch<{ statusCode: number; data: IUserProfile; message: string }>(
    `${endpoints.auth.user.update}`,
    dataSend
  );
  return response;
};