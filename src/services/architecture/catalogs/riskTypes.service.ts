// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetRiskTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.catalogs.riskTypes.all}`, { params });
  return response;
};

export const SaveOrUpdateRiskTypeService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.riskTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.riskTypes.save, dataSend);
  }
  return response;
};

export const GetRiskTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.riskTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteRiskTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.riskTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

export const GetRiskScaleMapService = async (riskId: string | number) => {
  const response = await axios.get(`/api/risk-scales/map/${riskId}`);
  return response;
};

export const GetRiskToleranceLevelsService = async (params?: any) => {
  const response = await axios.get(`/api/risk-tolerance-levels`, { params });
  return response;
};

export const SaveOrUpdateRiskToleranceLevelService = async (dataSend: any, id?: any) => {
  let response;
  if (id) {
    response = await axios.patch(`/api/risk-tolerance-levels/${id}`, dataSend);
  } else {
    response = await axios.post(`/api/risk-tolerance-levels`, dataSend);
  }
  return response;
};

// Probability Levels
export const GetRiskProbabilityLevelsService = async (params?: any) => {
  const response = await axios.get(`/api/risk-probability-levels`, { params });
  return response;
};
export const SaveOrUpdateRiskProbabilityLevelService = async (dataSend: any, id?: any) => {
  let response;
  if (id) {
    response = await axios.patch(`/api/risk-probability-levels/${id}`, dataSend);
  } else {
    response = await axios.post(`/api/risk-probability-levels`, dataSend);
  }
  return response;
};
export const DeleteRiskProbabilityLevelService = async (id: any) => {
  const response = await axios.delete(`/api/risk-probability-levels/${id}`);
  return response;
};

// Impact Levels
export const GetRiskImpactLevelsService = async (params?: any) => {
  const response = await axios.get(`/api/risk-impact-levels`, { params });
  return response;
};
export const SaveOrUpdateRiskImpactLevelService = async (dataSend: any, id?: any) => {
  let response;
  if (id) {
    response = await axios.patch(`/api/risk-impact-levels/${id}`, dataSend);
  } else {
    response = await axios.post(`/api/risk-impact-levels`, dataSend);
  }
  return response;
};
export const DeleteRiskImpactLevelService = async (id: any) => {
  const response = await axios.delete(`/api/risk-impact-levels/${id}`);
  return response;
};

// Deficiency Levels
export const GetRiskDeficiencyLevelsService = async (params?: any) => {
  const response = await axios.get(`/api/risk-deficiency-levels`, { params });
  return response;
};
export const SaveOrUpdateRiskDeficiencyLevelService = async (dataSend: any, id?: any) => {
  let response;
  if (id) {
    response = await axios.patch(`/api/risk-deficiency-levels/${id}`, dataSend);
  } else {
    response = await axios.post(`/api/risk-deficiency-levels`, dataSend);
  }
  return response;
};
export const DeleteRiskDeficiencyLevelService = async (id: any) => {
  const response = await axios.delete(`/api/risk-deficiency-levels/${id}`);
  return response;
};
