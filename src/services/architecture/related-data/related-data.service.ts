// utils
import axios, { endpoints } from 'src/utils/axios';

// -------------------------- BASE SERVICES --------------------------------------------

export const GetImpactRatioService = async () => {
  const response = await axios.get<any>(`${endpoints.architecture.relatedData.impactRatio}`);
  return response;
};

export const GetLocalExternalService = async () => {
  const response = await axios.get<any>(`${endpoints.architecture.relatedData.localExternal}`);
  return response;
};