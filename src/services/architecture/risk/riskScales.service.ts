import axios from 'src/utils/axios';

export const GetRiskScalesService = async (params?: any) => {
  const response = await axios.get(`/api/risk-scales`, { params });
  return response;
};

export const GetRiskDeficiencyLevelsService = async (params?: any) => {
  const response = await axios.get(`/api/risk-deficiency-levels`, { params });
  return response;
};

export const GetRiskImpactLevelsService = async (params?: any) => {
  const response = await axios.get(`/api/risk-impact-levels`, { params });
  return response;
};

export const GetRiskProbabilityLevelsService = async (params?: any) => {
  const response = await axios.get(`/api/risk-probability-levels`, { params });
  return response;
};

export const SaveOrUpdateRiskScaleService = async (dataSend: any, id?: number | string) => {
  let response;
  if (id != null) {
    response = await axios.patch(`/api/risk-scales/${id}`, dataSend);
  } else {
    response = await axios.post(`/api/risk-scales`, dataSend);
  }
  return response;
};

export const DeleteRiskScaleService = async (id: number | string) => {
  const response = await axios.delete(`/api/risk-scales/${id}`);
  return response;
};
