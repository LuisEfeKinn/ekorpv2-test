'use client';

import type { NotificationConfigEvent, NotificationConfigGroup } from 'src/types/notifications';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import { LoadingButton } from '@mui/lab';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';
import { UpdateNotifiableEventService } from 'src/services/notifications/notifiable-events.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type FormValues = {
  subjectTemplate: string;
  messageTemplate: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  event: NotificationConfigEvent | null;
  group: NotificationConfigGroup | null;
  onSaved?: () => void;
};

export function NotificationConfigEditDrawer({ open, onClose, event, group, onSaved }: Props) {
  const { t } = useTranslate('notifications');

  const schema = useMemo(
    () =>
      z.object({
        subjectTemplate: z.string().min(1, { message: 'Required' }),
        messageTemplate: z.string().min(1, { message: 'Required' }),
      }),
    []
  );

  const defaultValues = useMemo<FormValues>(
    () => ({
      subjectTemplate: event?.subjectTemplate ?? '',
      messageTemplate: event?.messageTemplate ?? '',
    }),
    [event]
  );

  const methods = useForm<FormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
  }, [open, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (!event?.id || !group?.auditableObject?.id) return;
    try {
      await UpdateNotifiableEventService(event.id, {
        notificationEventKey: event.notificationEventKey,
        subjectTemplate: data.subjectTemplate,
        messageTemplate: data.messageTemplate,
        auditableObject: { id: group.auditableObject.id },
      });
      toast.success(t('config.editDrawer.successMsg'));
      onClose();
      onSaved?.();
    } catch (error: any) {
      toast.error(error?.message || t('config.editDrawer.errorMsg'));
    }
  });

  const statusColor = (status: number) => (status === 1 ? 'success' : 'default');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{ sx: { width: { xs: 1, md: 560 } } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <Stack sx={{ height: 1 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" sx={{ px: 2.5, py: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              {t('config.editDrawer.title')}
            </Typography>
            <IconButton onClick={onClose}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>

          <Divider />

          <Scrollbar sx={{ flex: 1 }}>
            <Stack spacing={3} sx={{ p: 2.5 }}>
              {/* Read-only context */}
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 120 }}>
                    {t('config.editDrawer.eventKey')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {event?.notificationEventKey ?? '-'}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 120 }}>
                    {t('config.editDrawer.auditableObject')}
                  </Typography>
                  <Typography variant="body2">
                    {group?.auditableObject?.objectKey ?? '-'}
                  </Typography>
                </Stack>
              </Stack>

              <Divider sx={{ borderStyle: 'dashed' }} />

              {/* Editable fields */}
              <Field.Text name="subjectTemplate" label={t('config.editDrawer.subjectTemplate')} />

              <Stack spacing={0.75}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  {t('config.editDrawer.messageTemplate')}
                </Typography>
                <Field.Editor name="messageTemplate" />
              </Stack>

              <Divider sx={{ borderStyle: 'dashed' }} />

              {/* Existing notifications */}
              <Stack spacing={1.5}>
                <Typography variant="subtitle2">
                  {t('config.editDrawer.existingNotifications')}
                </Typography>

                {!event?.notifications?.length ? (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    {t('config.editDrawer.noNotifications')}
                  </Typography>
                ) : (
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {event.notifications.map((notif) => (
                      <Chip
                        key={notif.id}
                        label={notif.name}
                        size="small"
                        color={statusColor(notif.status)}
                        variant="soft"
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Scrollbar>

          <Divider />

          {/* Footer actions */}
          <Stack direction="row" spacing={1.5} sx={{ p: 2.5, justifyContent: 'flex-end' }}>
            <Button color="inherit" variant="soft" onClick={onClose}>
              {t('config.editDrawer.cancel')}
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              disabled={!event?.id}
            >
              {t('config.editDrawer.save')}
            </LoadingButton>
          </Stack>
        </Stack>
      </Form>
    </Drawer>
  );
}
