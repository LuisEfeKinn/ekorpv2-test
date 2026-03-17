// utils
import axios, { endpoints } from 'src/utils/axios';

// -------------------------- BASE SERVICES --------------------------------------------

export const GetApplicationTableMapByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.aplications.map.byId}/${id}`);
  return response;
};

export const GetApplicationTableMapByIdExpandService = async (id: any, nodeId: any) => {
  const editEndpoint = `${endpoints.architecture.aplications.map.expand}/${id}/expand/${nodeId}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const SaveApplicationTableMapCreateNodeService = async (id: any, nodeId: any, nodeData: any) => {
  const editEndpoint = `${endpoints.architecture.aplications.map.createNode}/${id}/expand/${nodeId}`;
  const response = await axios.post(editEndpoint, nodeData);
  return response;
};

export const DeleteApplicationTableMapNodeService = async (id: any, nodeId: any) => {
  const editEndpoint = `${endpoints.architecture.aplications.map.deleteNode}/${id}/expand/${nodeId}`;
  const response = await axios.delete(editEndpoint);
  return response;
};

// -------------------------- FLOW SERVICES --------------------------------------------

export const GetApplicationFlowService = async (params?: {
  domain?: number;
  type?: number;
}) => {
  const response = await axios.get<any>(endpoints.architecture.aplications.flow.all, { params });
  return response;
};

export const GetApplicationFlowByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.aplications.flow.byId}/${id}`);
  return response;
};

export const SaveApplicationFlowService = async (flowData: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.aplications.flow.save}/${id}/children`;
    response = await axios.post(updateEndpoint, flowData);
  } else {
    response = await axios.post(endpoints.architecture.aplications.table.save, flowData);
  }
  return response;
};

export const DeleteApplicationFlowService = async (id: any, childId: any) => {
  const editEndpoint = `${endpoints.architecture.aplications.flow.delete}/${id}/children/${childId}`;
  const response = await axios.delete(editEndpoint);
  return response;
};

export const GetDomainsService = async () => {
  const response = await axios.get<any>(endpoints.architecture.aplications.flow.domain);
  return response;
};

export const GetDomainByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.aplications.flow.domainById}/${id}`);
  return response;
};

export const GetTypeService = async () => {
  const response = await axios.get<any>(endpoints.architecture.aplications.flow.type);
  return response;
};

export const GetTypeByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.aplications.flow.typeById}/${id}`);
  return response;
};

// -------------------------- TIMELINE SERVICES --------------------------------------------

export const GetActiveTimelineDataService = async (params?: any) => {
  const response = await axios.get<any>(endpoints.architecture.aplications.timeline.active, { params });
  return response;
};

export const GetInactiveTimelineDataService = async (params?: any) => {
  const response = await axios.get<any>(endpoints.architecture.aplications.timeline.inactive, { params });
  return response;
};