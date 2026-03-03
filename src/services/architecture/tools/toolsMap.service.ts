import axios, { endpoints } from 'src/utils/axios';

export const GetToolsTableMapByIdService = async (id: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.tools.map.byId}/${id}`);
  return response;
};

export const GetToolsTableMapByIdExpandService = async (id: string, nodeId: string) => {
  const response = await axios.get(`${endpoints.architecture.tools.map.byId}/${id}/expand/${nodeId}`);
  return response;
};

