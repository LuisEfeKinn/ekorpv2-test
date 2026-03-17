import axios, { endpoints } from 'src/utils/axios';

export const SaveJobProcessRelationService = async (payload: any) => {
  const response = await axios.post<any>(endpoints.architecture.business.jobProcesses, payload);
  return response;
};

export const DownloadJobProcessTemplateService = async () => {
  const response = await axios.get(`${endpoints.architecture.business.jobProcesses}/download/template/job`, {
    responseType: 'blob',
  });
  return response;
};

export const GetJobProcessRelationByIdService = async (id: number | string) => {
  const response = await axios.get<any>(`${endpoints.architecture.business.jobProcesses}/${id}`);
  return response;
};

export const UpdateJobProcessRelationService = async (id: number | string, payload: any) => {
  const response = await axios.patch<any>(`${endpoints.architecture.business.jobProcesses}/${id}`, payload);
  return response;
};

export const DeleteJobProcessRelationService = async (id: number | string) => {
  const response = await axios.delete<any>(`${endpoints.architecture.business.jobProcesses}/${id}`);
  return response;
};

export const UploadJobProcessExcelService = async (jobId: number | string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post<any>(
    `${endpoints.architecture.business.jobProcesses}/upload/excel/job/${jobId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response;
};

export const DownloadJobProcessTemplateByProcessService = async () => {
  const response = await axios.get(`${endpoints.architecture.business.jobProcesses}/download/template/process`, {
    responseType: 'blob',
  });
  return response;
};

export const UploadJobProcessExcelByProcessService = async (processId: number | string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post<any>(
    `${endpoints.architecture.business.jobProcesses}/upload/excel/process/${processId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response;
};
