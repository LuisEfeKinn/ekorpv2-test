import axios from 'src/utils/axios';

export type JobTechnologyRelation = {
  id: number;
  observations?: string | null;
  job?: { id: number; name?: string } | null;
  technology?: { id: number; name?: string } | null;
};

export type SaveJobTechnologyRelationPayload = {
  observations?: string;
  job: { id: number };
  technology: { id: number };
};

export const GetJobTechnologyRelationsService = () =>
  axios.get<JobTechnologyRelation[]>('/api/job-technologies');

export const GetJobTechnologyRelationByIdService = (id: number | string) =>
  axios.get<JobTechnologyRelation>(`/api/job-technologies/${id}`);

export const SaveJobTechnologyRelationService = (payload: SaveJobTechnologyRelationPayload) =>
  axios.post('/api/job-technologies', payload);

export const UpdateJobTechnologyRelationService = (
  id: number | string,
  payload: SaveJobTechnologyRelationPayload
) => axios.patch(`/api/job-technologies/${id}`, payload);

export const DeleteJobTechnologyRelationService = (id: number | string) =>
  axios.delete(`/api/job-technologies/${id}`);
