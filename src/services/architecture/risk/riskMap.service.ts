import axios, { endpoints } from 'src/utils/axios';

export const GetRiskTableMapByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.risk.map.byId}/${id}`);
  return response;
};

export const GetRiskTableMapByIdExpandService = async (id: any, nodeId: any) => {
  const expandEndpoint = `${endpoints.architecture.risk.map.expand}/${id}/expand/${nodeId}`;
  const response = await axios.get<any>(expandEndpoint);
  return response;
};

export const SaveRiskTableMapCreateNodeService = async (id: any, nodeId: any, nodeData: any) => {
  const createEndpoint = `${endpoints.architecture.risk.map.createNode}/${id}/expand/${nodeId}`;
  const response = await axios.post<any>(createEndpoint, nodeData);
  return response;
};
