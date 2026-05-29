import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export type Feedback = {
  id: number;
  date: string;
  improvementLesson: boolean;
  description: string;
  problem: string;
  rootCause: string;
  proposedStrategy: string;
  estimatedResourceCosts: string;
  expectedResults: string;
  effectivenessIndicators: string;
  proposedWorkTeam: string;
  statusDate: string;
  file: string;
  type: string;
  link: string;
  originalFile: string;
  rejectionReason: string;
  reportReceiver: number;
  feedbackStatus: unknown | null;
  user: unknown | null;
  stateUser: unknown | null;
  createdBy: string | null;
  createdDate: string;
  lastModifiedBy: string | null;
  lastModifiedDate: string;
};

export type FeedbackCreatePayload = Omit<
  Feedback,
  'id' | 'feedbackStatus' | 'user' | 'stateUser' | 'createdBy' | 'createdDate' | 'lastModifiedBy' | 'lastModifiedDate'
>;

export type FeedbackUpdatePayload = Partial<FeedbackCreatePayload>;

export const SaveFeedbackService = async (data: any) => axios.post(endpoints.architecture.process.feedbacks.save, data);

export const SaveFeedbackObjectRelationService = async (data: any) =>
  axios.post(endpoints.architecture.process.feedbacks.relationSave, data);

export const SaveFeedbackToProcessService = async (processId: string | number, data: FeedbackCreatePayload) =>
  axios.post(`/api/feedbacks/process/${processId}`, data);

export const GetFeedbackByIdService = async (id: string | number) => axios.get<Feedback>(`/api/feedbacks/${id}`);

export const UpdateFeedbackService = async (id: string | number, data: FeedbackUpdatePayload) =>
  axios.patch(`/api/feedbacks/${id}`, data);

export const DeleteFeedbackService = async (id: string | number) => axios.delete(`/api/feedbacks/${id}`);
