'use client';

import type { Announcement, AnnouncementUpsertPayload } from 'src/types/notifications';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useRef, useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { SaveOrUpdateAnnouncementService } from 'src/services/notifications/announcements.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';

export type AnnouncementFormValues = {
  title: string;
  type: string;
  status: number | '';
  order: number | string;
  file: string;
  deadlineDate: string | null;
  content: string;
  author: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  current?: Announcement | null;
  onSaved?: () => void;
};

const STATUS_OPTIONS = [
  { value: 1, label: 'Activo' },
  { value: 0, label: 'Inactivo' },
  { value: 2, label: 'Eliminado' },
];

const TYPE_OPTIONS = [
  { value: 'NOTICIA', label: 'Noticia' },
  { value: 'EVENTO', label: 'Evento' },
  { value: 'ARTICULO', label: 'Artículo' },
];

export function AnnouncementCreateEditDrawer({ open, onClose, current, onSaved }: Props) {
  const isEdit = Boolean(current?.id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, { message: 'El título es requerido' }),
        type: z.string().min(1, { message: 'El tipo es requerido' }),
        status: z.preprocess(
          (val) => (val === '' ? undefined : Number(val)),
          z.number({ required_error: 'El estado es requerido' })
        ),
        order: z.preprocess(
          (val) => {
            if (val === '' || val === null || typeof val === 'undefined') return undefined;
            return Number(val);
          },
          z
            .number({ required_error: 'El orden es requerido' })
            .min(0, { message: 'El orden debe ser mayor o igual a 0' })
        ),
        file: z.string().min(1, { message: 'La imagen del anuncio es requerida' }),
        deadlineDate: z.string().nullable(),
        content: z.string().optional().default(''),
        author: z.string().optional().default(''),
      }),
    []
  );

  const defaultValues = useMemo<AnnouncementFormValues>(
    () => ({
      title: current?.title ?? '',
      type: current?.type ?? '',
      status: (typeof current?.status === 'number' ? Number(current.status) : ''),
      order: String(current?.order ?? 0),
      file: current?.file ?? '',
      deadlineDate: current?.deadlineDate ?? null,
      content: current?.content ?? '',
      author: current?.author ?? '',
    }),
    [current]
  );

  const methods = useForm<AnnouncementFormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
  }, [open, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const now = new Date().toISOString();
      const payload: AnnouncementUpsertPayload = {
        title: data.title,
        order: Number(data.order),
        file: data.file,
        type: data.type,
        rating: Number(current?.rating ?? 0),
        originalFile: current?.originalFile ?? '',
        content: data.content ?? '',
        author: data.author ?? '',
        status: Number(data.status),
        deadlineDate: data.deadlineDate ?? null,
        publicationDate: current?.publicationDate ?? now,
        announcementType: Number(current?.announcementType ?? 0),
        updateDate: now,
      };

      await SaveOrUpdateAnnouncementService(payload, current?.id);

      toast.success(isEdit ? 'Anuncio actualizado' : 'Anuncio creado');
      onClose();
      onSaved?.();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      toast.error(error?.message || 'Error al guardar el anuncio');
    }
  });

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
          <Stack direction="row" alignItems="center" sx={{ px: 2.5, py: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              {isEdit ? 'Editar anuncio' : 'Crear anuncio'}
            </Typography>
            <IconButton onClick={onClose}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>

          <Divider />

          <Scrollbar sx={{ height: 1 }}>
            <Stack spacing={2.5} sx={{ p: 2.5 }}>
              <Field.Text name="title" label="Título" required />

              <Field.Select name="type" label="Tipo" required>
                <MenuItem value="" disabled>
                  Seleccione
                </MenuItem>
                {TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Stack spacing={1}>
                <Field.Text name="file" label="Imagen del anuncio" placeholder="https://..." required />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (!selected) return;

                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = String(reader.result ?? '');
                      if (result) setValue('file', result, { shouldValidate: true });
                    };
                    reader.readAsDataURL(selected);
                  }}
                />

                <Button
                  variant="contained"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ width: 1 }}
                >
                  Cargar imagen
                </Button>
              </Stack>

              <Field.Editor name="content" label="Contenido" />
              <Field.Text name="author" label="Autor" />

              <Field.Select name="status" label="Estado" required>
                <MenuItem value="" disabled>
                  Seleccione
                </MenuItem>
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Text
                name="order"
                label="Orden"
                type="number"
                placeholder="0"
                slotProps={{
                  htmlInput: {
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    min: 0,
                    step: 1,
                  },
                }}
                onKeyDown={(e) => {
                  const isMeta = e.metaKey || e.ctrlKey;
                  const allowedKeys = [
                    'Backspace',
                    'Delete',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Tab',
                    'Home',
                    'End',
                    'Enter',
                  ];

                  if (allowedKeys.includes(e.key)) return;
                  if (isMeta && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;

                  // Only digits
                  if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                }}
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text');
                  if (text && !/^[0-9]+$/.test(text.trim())) e.preventDefault();
                }}
              />
              <Field.DatePicker name="deadlineDate" label="Fecha límite" />
            </Stack>
          </Scrollbar>

          <Divider />

          <Stack direction="row" spacing={1.5} sx={{ p: 2.5, justifyContent: 'flex-end' }}>
            <Button color="inherit" variant="soft" onClick={onClose}>
              Cancelar
            </Button>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              Guardar
            </LoadingButton>
          </Stack>
        </Stack>
      </Form>
    </Drawer>
  );
}
