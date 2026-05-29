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
  name: string;
  status: number;
  roleId?: number | null;
};

export const CreateNotificationConfigurationService = async (
  payload: CreateNotificationConfigPayload
) => axios.post(endpoints.notificationConfigurations.all, payload);

export const ActivateNotificationConfigService = (id: number) =>
  axios.patch(`${endpoints.notificationConfigurations.activate}/${id}/activate`);

export const DeactivateNotificationConfigService = (id: number) =>
  axios.patch(`${endpoints.notificationConfigurations.deactivate}/${id}/deactivate`);

export const AssignRoleToNotificationService = (id: number, roleId: number | null) =>
  axios.patch(`${endpoints.notificationConfigurations.all}/${id}/role`, { roleId });

export const DeleteNotificationConfigService = (id: number) =>
  axios.delete(`${endpoints.notificationConfigurations.all}/${id}`);
