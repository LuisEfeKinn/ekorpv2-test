import axios, { endpoints } from 'src/utils/axios';

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

export const SaveStrategicObjectiveFeedbackService = async (
  objectiveId: string,
  data: FeedbackCreatePayload
) => {
  const response = await axios.post(`${endpoints.architecture.business.objectives.feedbacks}/${objectiveId}`, data);
  return response;
};

export const GetFeedbackByIdService = async (id: string | number) => {
  const response = await axios.get<Feedback>(`/api/feedbacks/${id}`);
  return response;
};

export const UpdateStrategicObjectiveFeedbackService = async (
  id: string | number,
  data: FeedbackUpdatePayload
) => {
  const response = await axios.patch(`/api/feedbacks/${id}`, data);
  return response;
};

export const DeleteStrategicObjectiveFeedbackService = async (id: string | number) => {
  const response = await axios.delete(`/api/feedbacks/${id}`);
  return response;
};

export const DeleteStrategicObjectiveFeedbackObjectService = async (id: string | number) => {
  const response = await axios.delete(`/api/feedback-objects/${id}`);
  return response;
};
