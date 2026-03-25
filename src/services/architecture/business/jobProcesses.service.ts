import axios, { endpoints } from 'src/utils/axios';

export type SaveJobProcessRelationPayload = {
  isMain: boolean;
  description?: string;
  job: { id: number };
  process: { id: number };
  actionType?: { id: number };
};

export const SaveJobProcessRelationService = async (payload: SaveJobProcessRelationPayload) =>
  axios.post<unknown>(endpoints.architecture.business.jobProcesses, payload);

export const DownloadJobProcessTemplateService = async () => {
  const response = await axios.get(`${endpoints.architecture.business.jobProcesses}/download/template/job`, {
    responseType: 'blob',
  });
  return response;
};

export const GetJobProcessRelationByIdService = async (id: number | string) => {
  const response = await axios.get<{ data?: unknown }>(`${endpoints.architecture.business.jobProcesses}/${id}`);
  return response;
};

export type UpdateJobProcessRelationPayload = SaveJobProcessRelationPayload;

export const UpdateJobProcessRelationService = async (id: number | string, payload: UpdateJobProcessRelationPayload) =>
  axios.patch<unknown>(`${endpoints.architecture.business.jobProcesses}/${id}`, payload);

export const DeleteJobProcessRelationService = async (id: number | string) => {
  const response = await axios.delete<unknown>(`${endpoints.architecture.business.jobProcesses}/${id}`);
  return response;
};

export const UploadJobProcessExcelService = async (jobId: number | string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post<unknown>(
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
  const response = await axios.post<unknown>(
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
