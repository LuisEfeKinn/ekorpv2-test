import axios, { endpoints } from 'src/utils/axios';

export const GetRiskJobsMatrixService = async () => {
  const url = (endpoints as any)?.architecture?.risk?.processRisksMatrix ?? '/api/process-risks/matrix';
  const response = await axios.get(url);
  return response;
};
