// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetInventoryPaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.assets.inventory.all}`, { params });
  return response;
};

export const SaveOrUpdateInventoryService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.assets.inventory.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.assets.inventory.save, dataSend);
  }
  return response;
};

export const GetInventoryByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.assets.inventory.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteInventoryService = async (id: any) => {
  const deleteEndpoint = `${endpoints.assets.inventory.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};


// States

export const GetInventoryStatesService = async (params: any) => {
  const response = await axios.get<any>(endpoints.assets.inventory.states, { params });
  return response;
};


// History

export const GetInventoryHistoryByIdService = async (assetId: string, params: any) => {
  const response = await axios.get<any>(`${endpoints.assets.inventory.all}/history/${assetId}`, { params });
  return response;
};

export const GetInventoryHistoryService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.assets.inventory.history}`, { params });
  return response;
};

// Assignments

export const InventoryAssignmentsService = async (id: any, data: any) => {
  const assignmentsEndpoint = `${endpoints.assets.inventory.all}/${id}/assignments`;
  const response = await axios.patch<any>(assignmentsEndpoint, data);
  return response;
};

// My Assets

export const GetMyAssetsService = async (params: any) => {
  const response = await axios.get<any>(endpoints.assets.inventory.mine, { params });
  return response;
};