// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const PublicUploadDocumentService = async (formData: FormData) => {
  const response = await axios.post<any>(`${endpoints.register.publicUploadDocument}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

export const LivenessSessionService = async (identityId: string) => {

  const response = await axios.post<any>(`${endpoints.register.livenessSession}`, {
    identityId,
  });

  return response;
};

export const LivenessValidationService = async (id: string) => {
  const response = await axios.get<any>(`${endpoints.register.validateSession}/${id}`);
  return response;
};

export const PublicUploadLivenessService = async (formData: FormData) => {
  const response = await axios.post<any>(`${endpoints.register.publicUploadLiveness}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

export const BiometricValidationVerifyService = async (biometricValidationId: any) => {
  const response = await axios.get<any>(`${endpoints.register.biometricValidationVerify}/${biometricValidationId}`);
  return response;
};

// Phone verification service

export const SendPhoneVerificationCodeService = async (data: any) => {
  const response = await axios.post<any>(`${endpoints.register.sendPhoneVerificationCode}`, data);
  return response;
}

export const VerifyPhoneCodeService = async (data: any) => {
  const response = await axios.post<any>(`${endpoints.register.verifyPhoneCode}`, data);
  return response;
}


// Personal data service

export const BiometricValidationUpdateDataService = async (biometricValidationId: string, dataSend: any) => {
  const response = await axios.patch<any>(`${endpoints.register.biometricValidationUpdateData}/${biometricValidationId}`, dataSend);
  return response;
}


// Login biometric service

export const BiometricSignInService = async (formData: FormData) => {
  const response = await axios.post<any>(`${endpoints.register.biometricSignIn}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};