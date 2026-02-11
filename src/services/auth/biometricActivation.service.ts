// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const UploadDocumentService = async (formData: FormData) => {
  const response = await axios.post<any>(`${endpoints.register.uploadDocument}`, formData, {
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

export const UploadLivenessService = async (formData: FormData) => {
  const response = await axios.post<any>(`${endpoints.register.uploadLiveness}`, formData, {
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

// Biometric Activation
export const BiometricActivationService = async () => {
  const response = await axios.get<any>(`${endpoints.register.biometricActivation}`);
  return response;
}