// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetVigenciesPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.organization.vigencies.all}`, { params });
  return response;
};

export const SaveOrUpdateVigenciesService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.organization.vigencies.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.organization.vigencies.save, dataSend);
  }
  return response;
};

export const GetVigenciesByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.organization.vigencies.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteVigenciesService = async (id: any) => {
  const deleteEndpoint = `${endpoints.organization.vigencies.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

// ------------------------------- PERIODS ---------------------------------------

export const GetPeriodsByVigencyIdService = async (vigencyId: any, params?: any) => {
  const response = await axios.get(`${endpoints.organization.vigencies.periods.all}/${vigencyId}/periods`, { params });
  return response;
};

export const SaveOrUpdatePeriodsService = async (dataSend: any, periodId?: any) => {
  let response;
    if (periodId) {
    const updateEndpoint = `${endpoints.organization.vigencies.periods.update}/${periodId}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    const saveEndpoint = `${endpoints.organization.vigencies.periods.save}`;
    response = await axios.post(saveEndpoint, dataSend);
  }
    return response;
};

export const GetPeriodsByIdService = async (periodId: any) => {
  const editEndpoint = `${endpoints.organization.vigencies.periods.edit}/${periodId}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeletePeriodsService = async (periodId: any) => {
  const deleteEndpoint = `${endpoints.organization.vigencies.periods.delete}/${periodId}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};