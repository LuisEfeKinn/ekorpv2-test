// utils
import axios, { endpoints } from 'src/utils/axios';

// -------------------------- BASE SERVICES --------------------------------------------

export const GetDataTableMapByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.data.map.byId}/${id}`);
  return response;
};

export const GetDataTableMapByIdExpandService = async (id: any, nodeId: any) => {
  const editEndpoint = `${endpoints.architecture.data.map.expand}/${id}/expand/${nodeId}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const SaveDataTableMapCreateNodeService = async (id: any, nodeId: any, nodeData: any) => {
  const editEndpoint = `${endpoints.architecture.data.map.createNode}/${id}/expand/${nodeId}`;
  const response = await axios.post(editEndpoint, nodeData);
  return response;
};

export const DeleteDataTableMapNodeService = async (id: any, nodeId: any) => {
  const editEndpoint = `${endpoints.architecture.data.map.deleteNode}/${id}/expand/${nodeId}`;
  const response = await axios.delete(editEndpoint);
  return response;
}

// -------------------------- FLOW SERVICES --------------------------------------------

export const GetDataFlowService = async (params?: {
  domain?: number;
  type?: number;
}) => {
  const response = await axios.get<any>(endpoints.architecture.data.flow.all, { params });
  return response;
};

export const GetDataFlowByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.data.flow.byId}/${id}`);
  return response;
};

export const SaveDataFlowService = async (flowData: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.data.flow.save}/${id}/children`;
    response = await axios.post(updateEndpoint, flowData);
  } else {
    response = await axios.post(endpoints.architecture.data.table.save, flowData);
  }
  return response;
};

export const DeleteDataFlowService = async (id: any, childId: any) => {
  const editEndpoint = `${endpoints.architecture.data.flow.delete}/${id}/children/${childId}`;
  const response = await axios.delete(editEndpoint);
  return response;
};

export const GetDomainsService = async () => {
  const response = await axios.get<any>(endpoints.architecture.data.flow.domain);
  return response;
};

export const GetDomainByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.data.flow.domainById}/${id}`);
  return response;
};

export const GetTypeService = async () => {
  const response = await axios.get<any>(endpoints.architecture.data.flow.type);
  return response;
};

export const GetTypeByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.data.flow.typeById}/${id}`);
  return response;
};

// -------------------------- TIMELINE SERVICES --------------------------------------------

export const GetActiveTimelineDataService = async (params?: any) => {
  const response = await axios.get<any>(endpoints.architecture.data.timeline.active, { params });
  return response;
};

export const GetInactiveTimelineDataService = async (params?: any) => {
  const response = await axios.get<any>(endpoints.architecture.data.timeline.inactive, { params });
  return response;
};