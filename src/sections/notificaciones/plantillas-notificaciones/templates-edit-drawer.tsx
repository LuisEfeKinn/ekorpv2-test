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

import { UpdateNotifiableEventService } from 'src/services/notifications/notifiable-events.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';

type FormValues = {
  notificationEventKey: string;
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
  const schema = useMemo(
    () =>
      z.object({
        notificationEventKey: z.string().min(1),
        subjectTemplate: z.string().min(1, { message: 'El asunto es requerido' }),
        messageTemplate: z.string().min(1, { message: 'El mensaje es requerido' }),
      }),
    []
  );

  const defaultValues = useMemo<FormValues>(
    () => ({
      notificationEventKey: current?.notificationEventKey ?? '',
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
        notificationEventKey: data.notificationEventKey,
        subjectTemplate: data.subjectTemplate,
        messageTemplate: data.messageTemplate,
        auditableObject: { id: Number(auditableId) },
      };

      await UpdateNotifiableEventService(current.id, payload);
      toast.success('Plantilla actualizada');
      onClose();
      onSaved?.();
    } catch (error: any) {
      console.error('Error updating notifiable event:', error);
      toast.error(error?.message || 'Error al actualizar la plantilla');
    }
  });

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
          <Stack direction="row" alignItems="center" sx={{ px: 2.5, py: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              Editar plantilla
            </Typography>
            <IconButton onClick={onClose}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>

          <Divider />

          <Scrollbar sx={{ height: 1 }}>
            <Stack spacing={2.5} sx={{ p: 2.5 }}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle2">ID : {current?.id ?? '-'}</Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Nombre del evento : {current?.notificationEventKey ?? '-'}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Objeto Auditado : {current?.auditableObject?.objectKey ?? String(current?.auditableObject?.id ?? '-')}
                </Typography>
              </Stack>

              <Field.Text name="subjectTemplate" label="Asunto" />
              <Field.Editor name="messageTemplate" label="Mensaje" />
            </Stack>
          </Scrollbar>

          <Divider />

          <Stack direction="row" spacing={1.5} sx={{ p: 2.5, justifyContent: 'flex-end' }}>
            <Button color="inherit" variant="soft" onClick={onClose}>
              Cancelar
            </Button>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting} disabled={!current?.id}>
              Guardar
            </LoadingButton>
          </Stack>
        </Stack>
      </Form>
    </Drawer>
  );
}
