import type { Announcement, AnnouncementsListResponse, AnnouncementUpsertPayload } from 'src/types/notifications';

import axios, { endpoints } from 'src/utils/axios';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const extractAnnouncements = (payload: unknown): Announcement[] => {
  // Case A: tuple response: [[rows], total]
  if (Array.isArray(payload) && Array.isArray(payload[0]) && typeof payload[1] === 'number') {
    return payload[0] as Announcement[];
  }

  // Case B: plain array of rows
  if (Array.isArray(payload)) {
    return payload as Announcement[];
  }

  if (!isRecord(payload)) return [];

  // Case C: wrapper { data: [[rows], total] } or { data: rows }
  if (Array.isArray(payload.data)) {
    const data = payload.data;
    if (Array.isArray(data[0]) && typeof data[1] === 'number') return data[0] as Announcement[];
    return data as Announcement[];
  }

  if (isRecord(payload.data) && Array.isArray((payload.data as Record<string, unknown>).data)) {
    const nested = (payload.data as Record<string, unknown>).data;
    if (Array.isArray(nested) && Array.isArray(nested[0]) && typeof nested[1] === 'number') {
      return nested[0] as Announcement[];
    }
    return (nested as Announcement[]) ?? [];
  }

  return [];
};

export const GetAnnouncementsService = async (params?: Record<string, unknown>) => {
  const response = await axios.get<AnnouncementsListResponse | unknown>(endpoints.announcements.all, { params });
  return response;
};

export const SaveOrUpdateAnnouncementService = async (dataSend: AnnouncementUpsertPayload, id?: string | number) => {
  if (id !== undefined && id !== null && String(id).trim() !== '') {
    return axios.patch(`${endpoints.announcements.update}/${id}`, dataSend);
  }
  return axios.post(endpoints.announcements.save, dataSend);
};

export const DeleteAnnouncementService = async (id: string | number) =>
  axios.delete(`${endpoints.announcements.delete}/${id}`);

export const normalizeAnnouncementsResponse = (payload: unknown): Announcement[] => extractAnnouncements(payload);
