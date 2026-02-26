// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

interface ChangePasswordData {
  oldPassword: string;
  password: string;
  passwordConfirmation: string;
}

interface ResetPasswordData {
  token: string;
  oldPassword: string;
  password: string;
  passwordConfirmation: string;
}

// ----------------------------------------------------------------------

export const changePasswordService = async (data: ChangePasswordData) => {
  const response = await axios.post(endpoints.auth.changePassword, data);
  return response;
};

export const forgotPasswordService = async (email: string) => {
  const response = await axios.post(endpoints.auth.forgotPassword, { email });
  return response;
};

export const resetPasswordService = async (data: ResetPasswordData) => {
  const response = await axios.post(
    endpoints.auth.resetPassword, 
    { 
      oldPassword: data.oldPassword,
      password: data.password,
      passwordConfirmation: data.passwordConfirmation
    },
    {
      headers: {
        Authorization: `Bearer ${data.token}`
      }
    }
  );
  return response;
};
