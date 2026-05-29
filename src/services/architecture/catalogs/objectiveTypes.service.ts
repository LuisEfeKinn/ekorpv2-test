import type { ObjectiveType } from 'src/types/architecture/catalogs/objective-types';

// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetObjectiveTypesPaginationService = async (params: any) => {
  const response = await axios.get<any>(endpoints.architecture.catalogs.objectiveTypes.all, { 
    params: { ...params, _t: new Date().getTime() },
  });
  
  // Handle the expected response structure: [ [items...], totalCount ]
  if (response.data && Array.isArray(response.data)) {
    return response;
  }
  
  // Fallback: if response.data.data exists, wrap it in expected format
  if (response.data?.data) {
    const items = response.data.data;
    const total = response.data.totalItems || items.length;
    return {
      ...response,
      data: [items, total]
    };
  }
  
  return response;
};

export const SaveOrUpdateObjectiveTypeService = async (dataSend: Omit<ObjectiveType, 'id'> | ObjectiveType, id?: number) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.catalogs.objectiveTypes.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.catalogs.objectiveTypes.save, dataSend);
  }
  return response;
};

export const GetObjectiveTypeByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.catalogs.objectiveTypes.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  
  // Handle different response structures
  if (response.data && !response.data.data) {
    // If response.data is the object directly, wrap it
    response.data = { data: response.data };
  }
  
  return response;
};

export const DeleteObjectiveTypeService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.catalogs.objectiveTypes.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};