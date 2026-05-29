'use client';

import type { NotifiableEvent, NotifiableEventUpdatePayload } from 'src/types/notifications';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
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
  current?: NotifiableEvent | null;
  onSaved?: () => void;
};

export function TemplatesEditDrawer({ open, onClose, current, onSaved }: Props) {
  const { t } = useTranslate('notifications');

  const schema = useMemo(
    () =>
      z.object({
        subjectTemplate: z.string().min(1, { message: 'El asunto es requerido' }),
        messageTemplate: z.string().min(1, { message: 'El mensaje es requerido' }),
      }),
    []
  );

  const defaultValues = useMemo<FormValues>(
    () => ({
      subjectTemplate: current?.subjectTemplate ?? '',
      messageTemplate: current?.messageTemplate ?? '',
    }),
    [current]
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

  const handleClear = () => {
    reset({ subjectTemplate: '', messageTemplate: '' });
  };

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
  }, [open, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (!current?.id) return;
    try {
      const auditableId = current?.auditableObject?.id;
      if (!auditableId) {
        toast.error('Este evento no tiene objeto auditado');
        return;
      }

      const payload: NotifiableEventUpdatePayload = {
        notificationEventKey: current.notificationEventKey,
        subjectTemplate: data.subjectTemplate,
        messageTemplate: data.messageTemplate,
        auditableObject: { id: Number(auditableId) },
      };

      await UpdateNotifiableEventService(current.id, payload);
      toast.success(t('templates.editDrawer.successMsg'));
      onClose();
      onSaved?.();
    } catch (error: any) {
      toast.error(error?.message || t('templates.editDrawer.errorMsg'));
    }
  });

  const auditableObjectName =
    current?.auditableObject?.objectKey ?? String(current?.auditableObject?.id ?? '-');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{ sx: { width: { xs: 1, md: 640 } } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <Stack sx={{ height: 1 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" sx={{ px: 2.5, py: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              {t('templates.editDrawer.title')}
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
                    {t('templates.editDrawer.id')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {current?.id ?? '-'}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 130 }}>
                    {t('templates.editDrawer.eventName')}
                  </Typography>
                  <Typography variant="body2">
                    {current?.notificationEventKey ?? '-'}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 130 }}>
                    {t('templates.editDrawer.auditableObject')}
                  </Typography>
                  <Typography variant="body2">
                    {auditableObjectName}
                  </Typography>
                </Stack>
              </Stack>

              <Divider sx={{ borderStyle: 'dashed' }} />

              {/* Editable fields */}
              <Field.Text name="subjectTemplate" label={t('templates.editDrawer.subject')} />

              <Stack spacing={0.75}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  {t('templates.editDrawer.message')}
                </Typography>
                <Field.Editor name="messageTemplate" />
              </Stack>
            </Stack>
          </Scrollbar>

          <Divider />

          {/* Footer */}
          <Stack direction="row" spacing={1.5} sx={{ p: 2.5, justifyContent: 'flex-end' }}>
            <Button color="inherit" variant="soft" onClick={onClose}>
              {t('templates.editDrawer.cancel')}
            </Button>
            <Button color="warning" variant="soft" onClick={handleClear}>
              {t('templates.editDrawer.clear')}
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              disabled={!current?.id}
            >
              {t('templates.editDrawer.save')}
            </LoadingButton>
          </Stack>
        </Stack>
      </Form>
    </Drawer>
  );
}
