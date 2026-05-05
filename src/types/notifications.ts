export type Announcement = {
  id: number;
  title: string;
  order: number;
  file: string;
  type: string;
  rating?: number | string | null;
  originalFile?: string | null;
  content?: string | null;
  author?: string | null;
  status?: number | null;
  deadlineDate?: string | null;
  publicationDate?: string | null;
  announcementType?: number | null;
  updateDate?: string | null;
};

export type AnnouncementsListResponse = {
  statusCode?: number;
  data?: Announcement[];
  message?: string;
};

export type NotifiableEventAuditableObject = {
  id: number;
  objectKey?: string;
  createdBy?: unknown;
  createdDate?: string;
  lastModifiedBy?: unknown;
  lastModifiedDate?: string;
};

export type NotifiableEvent = {
  notifications?: Record<string, unknown>;
  createdBy?: unknown;
  createdDate?: string;
  lastModifiedBy?: unknown;
  lastModifiedDate?: string;
  id: number;
  notificationEventKey: string;
  subjectTemplate: string;
  messageTemplate: string;
  auditableObject: NotifiableEventAuditableObject | null;
};

export type NotifiableEventsListResponse = [NotifiableEvent[], number];

export type NotifiableEventUpdatePayload = {
  notificationEventKey: string;
  subjectTemplate: string;
  messageTemplate: string;
  auditableObject: { id: number };
};

// Notification Configuration types

export type NotificationConfigNotifiable = {
  id: number;
  notifiableKey: string;
};

export type NotificationConfigItem = {
  id: number;
  name: string;
  status: number;
  notifiable: NotificationConfigNotifiable;
};

export type NotificationConfigEvent = {
  id: number;
  notificationEventKey: string;
  subjectTemplate: string;
  messageTemplate: string;
  notifications: NotificationConfigItem[];
};

export type NotificationConfigGroup = {
  auditableObject: {
    id: number;
    objectKey: string;
  };
  events: NotificationConfigEvent[];
};

export type AnnouncementUpsertPayload = {
  title: string;
  order: number;
  file: string;
  type: string;
  rating: number;
  originalFile: string;
  content: string;
  author: string;
  status: number;
  deadlineDate: string | null;
  publicationDate: string;
  announcementType: number;
  updateDate: string;
};

