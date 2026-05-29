import type { NotifiableEvent, NotifiableEventsListResponse, NotifiableEventUpdatePayload } from 'src/types/notifications';

import axios, { endpoints } from 'src/utils/axios';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export const normalizeNotifiableEventsResponse = (payload: unknown): { rows: NotifiableEvent[]; total: number } => {
  // Case A: API returns a plain array of events
  if (Array.isArray(payload) && payload.length > 0 && isRecord(payload[0]) && 'notificationEventKey' in payload[0]) {
    return { rows: payload as NotifiableEvent[], total: (payload as NotifiableEvent[]).length };
  }

  // Case B: API returns tuple: [rows, total]
  if (Array.isArray(payload) && Array.isArray(payload[0]) && typeof payload[1] === 'number') {
    return { rows: payload[0] as NotifiableEvent[], total: payload[1] as number };
  }

  if (isRecord(payload) && Array.isArray(payload.data)) {
    const data = payload.data;
    if (Array.isArray(data) && Array.isArray(data[0]) && typeof data[1] === 'number') {
      return { rows: data[0] as NotifiableEvent[], total: data[1] as number };
    }
  }

  // Case C: common wrappers
  if (isRecord(payload)) {
    const maybeRows = (payload as any).data ?? (payload as any).rows ?? (payload as any).content;
    const maybeTotal = (payload as any).total ?? (payload as any).count ?? (payload as any).totalElements;
    if (Array.isArray(maybeRows)) {
      return {
        rows: maybeRows as NotifiableEvent[],
        total: typeof maybeTotal === 'number' ? (maybeTotal as number) : (maybeRows as NotifiableEvent[]).length,
      };
    }
  }

  return { rows: [], total: 0 };
};

export const GetNotifiableEventsService = async () => {
  const response = await axios.get<NotifiableEventsListResponse | NotifiableEvent[] | unknown>(endpoints.notifiableEvents.all);
  return response;
};

export const UpdateNotifiableEventService = async (id: string | number, dataSend: NotifiableEventUpdatePayload) =>
  axios.patch(`${endpoints.notifiableEvents.update}/${id}`, dataSend);
