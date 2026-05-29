import axios from 'src/utils/axios';

export type JobDataRelation = {
  id: number;
  observations?: string | null;
  job?: { id: number; name?: string } | null;
  data?: { id: number; name?: string } | null;
};

export type SaveJobDataRelationPayload = {
  observations?: string;
  job: { id: number };
  data: { id: number };
};

export const GetJobDataRelationsService = () =>
  axios.get<JobDataRelation[]>('/api/job-data');

export const GetJobDataRelationByIdService = (id: number | string) =>
  axios.get<JobDataRelation>(`/api/job-data/${id}`);

export const SaveJobDataRelationService = (payload: SaveJobDataRelationPayload) =>
  axios.post('/api/job-data', payload);

export const UpdateJobDataRelationService = (
  id: number | string,
  payload: SaveJobDataRelationPayload
) => axios.patch(`/api/job-data/${id}`, payload);

export const DeleteJobDataRelationService = (id: number | string) =>
  axios.delete(`/api/job-data/${id}`);
