'use client';

import type { NotificationConfigEvent, NotificationConfigGroup } from 'src/types/notifications';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import { LoadingButton } from '@mui/lab';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';
import { CreateNotificationConfigurationService } from 'src/services/notifications/notification-configurations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type FormValues = {
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  event: NotificationConfigEvent | null;
  group: NotificationConfigGroup | null;
  notifiableId: number | null;
  onSaved?: () => void;
};

export function NotificationConfigAddDrawer({
  open,
  onClose,
  event,
  group,
  notifiableId,
  onSaved,
}: Props) {
  const { t } = useTranslate('notifications');

  const schema = useMemo(
    () => z.object({ name: z.string().min(1, { message: 'Required' }) }),
    []
  );

  const defaultValues = useMemo<FormValues>(() => ({ name: '' }), []);

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
    if (!event?.id) return;
    try {
      await CreateNotificationConfigurationService({
        eventId: event.id,
        notifiableId: notifiableId ?? 0,
        name: data.name,
        status: 1,
      });
      toast.success(t('config.addDrawer.successMsg'));
      onClose();
      onSaved?.();
    } catch (error: any) {
      toast.error(error?.message || t('config.addDrawer.errorMsg'));
    }
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{ sx: { width: { xs: 1, md: 480 } } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <Stack sx={{ height: 1 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" sx={{ px: 2.5, py: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              {t('config.addDrawer.title')}
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
                  <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 130 }}>
                    {t('config.addDrawer.eventContext')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {event?.notificationEventKey ?? '-'}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 130 }}>
                    {t('config.addDrawer.auditableObject')}
                  </Typography>
                  <Typography variant="body2">
                    {group?.auditableObject?.objectKey ?? '-'}
                  </Typography>
                </Stack>
              </Stack>

              <Divider sx={{ borderStyle: 'dashed' }} />

              {/* Único campo editable */}
              <Field.Text
                name="name"
                label={t('config.addDrawer.name')}
                autoFocus
              />
            </Stack>
          </Scrollbar>

          <Divider />

          {/* Footer */}
          <Stack direction="row" spacing={1.5} sx={{ p: 2.5, justifyContent: 'flex-end' }}>
            <Button color="inherit" variant="soft" onClick={onClose}>
              {t('config.addDrawer.cancel')}
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              disabled={!event?.id}
            >
              {t('config.addDrawer.save')}
            </LoadingButton>
          </Stack>
        </Stack>
      </Form>
    </Drawer>
  );
}
