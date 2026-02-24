// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetProcessTablePaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.process.table.all}`, { params });
  return response;
};

export const GetProcessFlowService = async () => {
  const response = await axios.get(endpoints.architecture.process.flow.all);
  return response;
};

export const SaveOrUpdateProcessTableService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.process.table.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.process.table.save, dataSend);
  }
  return response;
};

export const GetProcessTableByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.process.table.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteProcessTableService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.process.table.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

export const GetProcessMapByIdService = async (processId: string) => {
  const response = await axios.get(`${endpoints.architecture.process.table.all}/map/${processId}`);
  return response;
};

export const GetProcessMapExpandByIdService = async (processId: string, nodeId: string) => {
  const response = await axios.get(`${endpoints.architecture.process.table.all}/map/${processId}/expand/${nodeId}`);
  return response;
};

export const GetProcessRasciMatrixService = async () => {
  const response = await axios.get('/api/job-processes/rasci-matrix');
  return response;
};

export const DownloadProcessRasciMatrixExcelService = async () => {
  const response = await axios.get('/api/job-processes/rasci-matrix/excel', {
    responseType: 'blob',
  });
  return response;
};

export const UploadProcessRasciMatrixExcelService = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post('/api/job-processes/rasci-matrix/excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};
