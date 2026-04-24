import axios from 'src/utils/axios';

export type DocumentFeedback = {
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
  DocumentFeedback,
  'id' | 'feedbackStatus' | 'user' | 'stateUser' | 'createdBy' | 'createdDate' | 'lastModifiedBy' | 'lastModifiedDate'
>;

export type FeedbackUpdatePayload = Partial<FeedbackCreatePayload>;

export const SaveDocumentFeedbackService = async (
  documentId: string | number,
  data: FeedbackCreatePayload
) => {
  const response = await axios.post(`/api/feedbacks/document/${documentId}`, data);
  return response;
};

export const SaveDocumentFeedbackWithFileService = async (
  documentId: string | number,
  formData: FormData
) => {
  const response = await axios.post(`/api/feedbacks/document/${documentId}/with-file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response;
};

export const GetFeedbackByIdService = async (id: string | number) => {
  const response = await axios.get<DocumentFeedback>(`/api/feedbacks/${id}`);
  return response;
};

export const UpdateDocumentFeedbackService = async (
  id: string | number,
  data: FeedbackUpdatePayload
) => {
  const response = await axios.patch(`/api/feedbacks/${id}`, data);
  return response;
};

export const DeleteDocumentFeedbackService = async (id: string | number) => {
  const response = await axios.delete(`/api/feedbacks/${id}`);
  return response;
};

export const DownloadDocumentFeedbackAttachmentService = async (
  feedbackId: string | number,
  attachmentId: string | number
) => {
  const response = await axios.get(
    `/api/feedbacks/${feedbackId}/files/${attachmentId}/download`,
    { responseType: 'blob' }
  );
  return response;
};
