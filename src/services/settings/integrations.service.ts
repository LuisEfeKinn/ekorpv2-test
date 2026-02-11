// utils
import type { ICourseListingPaginationParams, ICourseListingPaginationResponse } from 'src/types/settings';

import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetIntegrationsPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.settings.integrations.all}`, { params });
  return response;
};

export const SaveOrUpdateIntegrationsService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.settings.integrations.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.settings.integrations.save, dataSend);
  }
  return response;
};

export const GetIntegrationsByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.settings.integrations.edit}/${id}/parameters`;
  const response = await axios.get(editEndpoint);
  return response;
}

export const DeleteIntegrationsService = async (id: any) => {
  const deleteEndpoint = `${endpoints.settings.integrations.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

export const GetAllDefaultParametersService = async () => {
  const response = await axios.get<any>(`${endpoints.settings.integrations.parameters}`);
  return response;
};

export const GetCourseListingPaginationService = async (params: ICourseListingPaginationParams) => {
  const response = await axios.get<ICourseListingPaginationResponse>(`${endpoints.settings.integrations.courses.all}`, { params });
  return response;
};

export const GetSyncCoursePlatformByIdService = async (id: string) => {
  const editEndpoint = `${endpoints.settings.integrations.sync}/${id}/synchronize`;
  const response = await axios.post(editEndpoint);
  return response;
};


// ------------------------------- CATEGORIES ---------------------------------------

export const GetCategoriesByInstanceIdService = async (instanceId: string, params?: any) => {
  const response = await axios.get<any>(`${endpoints.settings.integrations.categories.all}/${instanceId}/categories`, { params });
  return response;
};

// ------------------------------- COURSES ------------------------------------------

export const GetCoursesByCategoryLmsIdService = async (instanceId: string, categoryLmsId: string, params?: any) => {
  const response = await axios.get<any>(`${endpoints.settings.integrations.courses.all}/${instanceId}/categories/${categoryLmsId}/courses`, { params });
  return response;
};