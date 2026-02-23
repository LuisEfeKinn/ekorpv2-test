// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const GetRiskTablePaginationService = async (params: any) => {
  const response = await axios.get<any>(`${endpoints.architecture.risk.table.all}`, { params });
  return response;
};

export const SaveOrUpdateRiskTableService = async (dataSend: any, id?: any) => {
  let response;

  if (id) {
    const updateEndpoint = `${endpoints.architecture.risk.table.update}/${id}`;
    response = await axios.patch(updateEndpoint, dataSend);
  } else {
    response = await axios.post(endpoints.architecture.risk.table.save, dataSend);
  }
  return response;
};

export const GetRiskTableByIdService = async (id: any) => {
  const editEndpoint = `${endpoints.architecture.risk.table.edit}/${id}`;
  const response = await axios.get(editEndpoint);
  return response;
};

export const DeleteRiskTableService = async (id: any) => {
  const deleteEndpoint = `${endpoints.architecture.risk.table.delete}/${id}`;
  const response = await axios.delete(deleteEndpoint);
  return response;
};

// ----------------------------------------------------------------------

export const GetRiskTypesService = async () => {
  const response = await axios.get(endpoints.architecture.risk.table.types);
  return response;
}

export const DownloadRisksExcelService = async (params?: any) => {
  const response = await axios.get(endpoints.architecture.risk.table.downloadExcel, { responseType: 'blob', params });
  return response;
};

export const UploadRisksService = async (formData: FormData) => {
  const response = await axios.post(endpoints.architecture.risk.table.upload, formData);
  return response;
};
