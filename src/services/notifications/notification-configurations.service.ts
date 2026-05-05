import type { NotificationConfigGroup } from 'src/types/notifications';

import axios, { endpoints } from 'src/utils/axios';

export const GetNotificationConfigurationsService = async (params?: {
  auditableObjectId?: number;
  auditableObjectKey?: string;
}) => {
  const response = await axios.get<NotificationConfigGroup[]>(
    endpoints.notificationConfigurations.all,
    { params }
  );
  return response;
};

export type CreateNotificationConfigPayload = {
  eventId: number;
  notifiableId: number;
  name: string;
  status: number;
};

export const CreateNotificationConfigurationService = async (
  payload: CreateNotificationConfigPayload
) => axios.post(endpoints.notificationConfigurations.all, payload);
