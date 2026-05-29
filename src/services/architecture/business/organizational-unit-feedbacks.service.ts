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

export const SaveOrganizationalUnitFeedbackService = async (
  orgUnitId: string,
  data: FeedbackCreatePayload
) => {
  const response = await axios.post(`${endpoints.organization.organizationalUnits.feedbacks}/${orgUnitId}`, data);
  return response;
};

export const GetFeedbackByIdService = async (feedbackId: string | number) => {
  const response = await axios.get<Feedback>(`/api/feedbacks/${feedbackId}`);
  return response;
};

export const UpdateOrganizationalUnitFeedbackService = async (
  feedbackId: string | number,
  data: FeedbackUpdatePayload
) => {
  const response = await axios.patch(`/api/feedbacks/${feedbackId}`, data);
  return response;
};

export const DeleteFeedbackObjectService = async (relationId: string | number) => {
  const response = await axios.delete(`/api/feedback-objects/${relationId}`);
  return response;
};
