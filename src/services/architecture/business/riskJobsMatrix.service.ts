import axios, { endpoints } from 'src/utils/axios';

export const GetRiskJobsMatrixService = async () =>
  axios.get<unknown>(endpoints.architecture.risk.processRisksMatrix);

export const GetRiskProcessMatrixService = async () =>
  axios.get<unknown>(endpoints.architecture.risk.processRisksMatrixProcess);
