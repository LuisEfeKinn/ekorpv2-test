// utils
import axios, { endpoints } from 'src/utils/axios';

// -------------------------- BASE SERVICES --------------------------------------------

export const GetInfraestructureTableMapByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.infrastructure.map.byId}/${id}`);
  return response;
};

export const GetInfraestructureTableMapByIdExpandService = async (id: any, nodeId: any) => {
  const editEndpoint = `${endpoints.architecture.infrastructure.map.expand}/${id}/expand/${nodeId}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const SaveInfraestructureTableMapCreateNodeService = async (id: any, nodeId: any, nodeData: any) => {
  const editEndpoint = `${endpoints.architecture.infrastructure.map.createNode}/${id}/expand/${nodeId}`;
  const response = await axios.post(editEndpoint, nodeData);
  return response;
};

export const DeleteInfraestructureTableMapNodeService = async (id: any, nodeId: any) => {
  const editEndpoint = `${endpoints.architecture.infrastructure.map.deleteNode}/${id}/expand/${nodeId}`;
  const response = await axios.delete(editEndpoint);
  return response;
};

// -------------------------- FLOW SERVICES --------------------------------------------

export const GetInfraestructureFlowService = async (params?: {
  domain?: number;
  type?: number;
}) => {
  const response = await axios.get<any>(endpoints.architecture.infrastructure.flow.all);
  return response;
};

export const GetInfraestructureFlowByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.infrastructure.flow.byId}/${id}`);
  return response;
};

export const SaveInfraestructureFlowService = async (flowData: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.infrastructure.flow.save}/${id}/children`;
    response = await axios.post(updateEndpoint, flowData);
  } else {
    response = await axios.post(endpoints.architecture.infrastructure.table.save, flowData);
  }
  return response;
};

export const DeleteInfraestructureFlowService = async (id: any, childId: any) => {
  const editEndpoint = `${endpoints.architecture.infrastructure.flow.delete}/${id}/children/${childId}`;
  const response = await axios.delete(editEndpoint);
  return response;
};

export const GetDomainsService = async () => {
  const response = await axios.get<any>(endpoints.architecture.infrastructure.flow.domain);
  return response;
};

export const GetDomainsByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.infrastructure.flow.domainById}/${id}`);
  return response;
};

export const GetTypesService = async () => {
  const response = await axios.get<any>(endpoints.architecture.infrastructure.flow.type);
  return response;
};

export const GetTypeByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.infrastructure.flow.typeById}/${id}`);
  return response;
};

// -------------------------- TIMELINE SERVICES --------------------------------------------

export const GetActiveTimelineDataService = async (params?: any) => {
  const response = await axios.get<any>(endpoints.architecture.infrastructure.timeline.active, { params });
  return response;
};

export const GetInactiveTimelineDataService = async (params?: any) => {
  const response = await axios.get<any>(endpoints.architecture.infrastructure.timeline.inactive, { params });
  return response;
};