'use client';

import type { Announcement, AnnouncementUpsertPayload } from 'src/types/notifications';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { varAlpha } from 'minimal-shared/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';
import {
  GetAnnouncementFileViewService,
  SaveOrUpdateAnnouncementService,
} from 'src/services/notifications/announcements.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';

export type AnnouncementFormValues = {
  title: string;
  type: string;
  status: number | '';
  order: number | string;
  file?: string;
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

const STATUS_VALUES = [1, 0, 2] as const;
const TYPE_VALUES = ['NOTICIA', 'EVENTO', 'ARTICULO'] as const;

export function AnnouncementCreateEditDrawer({ open, onClose, current, onSaved }: Props) {
  const { t } = useTranslate('notifications');
  const isEdit = Boolean(current?.id);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 1, label: t('announcements.status.active') },
    { value: 0, label: t('announcements.status.inactive') },
    { value: 2, label: t('announcements.status.deleted') },
  ], [t]);

  const TYPE_OPTIONS = useMemo(() => [
    { value: 'NOTICIA', label: t('announcements.types.news') },
    { value: 'EVENTO', label: t('announcements.types.event') },
    { value: 'ARTICULO', label: t('announcements.types.article') },
  ], [t]);

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, { message: t('announcements.form.validation.titleRequired') }),
        type: z.string().min(1, { message: t('announcements.form.validation.typeRequired') }),
        status: z.preprocess(
          (val) => (val === '' ? undefined : Number(val)),
          z.number({ required_error: t('announcements.form.validation.statusRequired') })
        ),
        order: z.preprocess(
          (val) => {
            if (val === '' || val === null || typeof val === 'undefined') return undefined;
            return Number(val);
          },
          z
            .number({ required_error: t('announcements.form.validation.orderRequired') })
            .min(0, { message: t('announcements.form.validation.orderMin') })
        ),
        file: z.string().optional().default(''),
        deadlineDate: z.string().nullable(),
        content: z.string().optional().default(''),
        author: z.string().optional().default(''),
      }),
    [t]
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

  const handleDropAccepted = useCallback((files: File[]) => {
    const selected = files[0];
    if (!selected) return;
    setImageFile(selected);
    setValue('file', '', { shouldValidate: false });
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    maxFiles: 1,
    accept: { 'image/*': [] },
    onDropAccepted: handleDropAccepted,
  });

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
    setImageFile(null);
    setPreviewUrl(null);
    if (current?.id) {
      GetAnnouncementFileViewService(current.id)
        .then(setPreviewUrl)
        .catch(() => setPreviewUrl(null));
    }
  }, [open, defaultValues, reset, current?.id]);

  const onSubmit = handleSubmit(async (data) => {
    if (!imageFile && !data.file?.trim()) {
      toast.error(t('announcements.form.validation.fileRequired'));
      return;
    }

    try {
      const now = new Date().toISOString();

      if (imageFile) {
        const fd = new FormData();
        fd.append('title', data.title);
        fd.append('order', String(Number(data.order)));
        fd.append('type', data.type);
        fd.append('rating', String(Number(current?.rating ?? 0)));
        fd.append('content', data.content ?? '');
        fd.append('author', data.author ?? '');
        fd.append('status', String(Number(data.status)));
        fd.append('announcementType', String(Number(current?.announcementType ?? 0)));
        if (data.deadlineDate) fd.append('deadlineDate', data.deadlineDate);
        fd.append('publicationDate', current?.publicationDate ?? now);
        fd.append('updateDate', now);
        fd.append('image', imageFile);
        await SaveOrUpdateAnnouncementService(fd, current?.id);
      } else {
        const payload: AnnouncementUpsertPayload = {
          title: data.title,
          order: Number(data.order),
          file: data.file ?? '',
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
      }

      toast.success(isEdit ? t('announcements.messages.updated') : t('announcements.messages.created'));
      onClose();
      onSaved?.();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      toast.error(error?.message || t('announcements.messages.error.saving'));
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
              {isEdit ? t('announcements.drawer.editTitle') : t('announcements.drawer.createTitle')}
            </Typography>
            <IconButton onClick={onClose}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>

          <Divider />

          <Scrollbar sx={{ height: 1 }}>
            <Stack spacing={2.5} sx={{ p: 2.5 }}>
              <Field.Text name="title" label={t('announcements.form.title')} required />

              <Field.Select name="type" label={t('announcements.form.type')} required>
                <MenuItem value="" disabled>
                  {t('announcements.form.select')}
                </MenuItem>
                {TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Stack spacing={1.5}>
                <Field.Text
                  name="file"
                  label={t('announcements.form.file')}
                  placeholder={t('announcements.form.filePlaceholder')}
                  onChange={(e) => {
                    if (e.target.value) setImageFile(null);
                  }}
                />

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Divider sx={{ flex: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    {t('announcements.form.orUploadFile', { defaultValue: 'o sube un archivo' })}
                  </Typography>
                  <Divider sx={{ flex: 1 }} />
                </Stack>

                <Box
                  {...getRootProps()}
                  sx={[
                    (theme) => ({
                      p: 3,
                      borderRadius: 1.5,
                      textAlign: 'center',
                      outline: 'none',
                      cursor: 'pointer',
                      border: `dashed 1px ${theme.vars.palette.divider}`,
                      backgroundColor: theme.vars.palette.background.neutral,
                      transition: theme.transitions.create(['border-color', 'background-color'], {
                        duration: theme.transitions.duration.shorter,
                      }),
                      ...(isDragActive && {
                        borderColor: theme.vars.palette.primary.main,
                        backgroundColor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                      }),
                    }),
                  ]}
                >
                  <input {...getInputProps()} />

                  {imageFile ? (
                    <Stack spacing={0.5} alignItems="center">
                      <Box
                        component="img"
                        src={URL.createObjectURL(imageFile)}
                        alt={imageFile.name}
                        sx={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 320 }}>
                        {imageFile.name}
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                        }}
                        sx={{ textTransform: 'none' }}
                      >
                        {t('announcements.actions.removeFile', { defaultValue: 'Quitar' })}
                      </Button>
                    </Stack>
                  ) : previewUrl ? (
                    <Stack spacing={0.5} alignItems="center">
                      <Box
                        component="img"
                        src={previewUrl}
                        alt="preview"
                        sx={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {t('announcements.form.clickToReplace', { defaultValue: 'Haz clic o arrastra para reemplazar' })}
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={0.5} alignItems="center">
                      <Iconify icon="eva:cloud-upload-fill" width={32} sx={{ color: 'text.disabled' }} />
                      <Typography variant="subtitle2">
                        {isDragActive
                          ? t('announcements.form.dropHere', { defaultValue: 'Suelta la imagen aquí' })
                          : t('announcements.form.dragOrClick', { defaultValue: 'Arrastra una imagen o haz clic para seleccionar' })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('announcements.form.imageFormats', { defaultValue: 'PNG, JPG, GIF, WEBP...' })}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Stack>

              <Field.Editor name="content" label={t('announcements.form.content')} placeholder={t('announcements.form.contentPlaceholder')} />
              <Field.Text name="author" label={t('announcements.form.author')} />

              <Field.Select name="status" label={t('announcements.form.status')} required>
                <MenuItem value="" disabled>
                  {t('announcements.form.select')}
                </MenuItem>
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Text
                name="order"
                label={t('announcements.form.order')}
                type="number"
                placeholder={t('announcements.form.orderPlaceholder')}
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

                  if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                }}
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text');
                  if (text && !/^[0-9]+$/.test(text.trim())) e.preventDefault();
                }}
              />
              <Field.DatePicker name="deadlineDate" label={t('announcements.form.deadlineDate')} />
            </Stack>
          </Scrollbar>

          <Divider />

          <Stack direction="row" spacing={1.5} sx={{ p: 2.5, justifyContent: 'flex-end' }}>
            <Button color="inherit" variant="soft" onClick={onClose}>
              {t('announcements.actions.cancel')}
            </Button>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              {t('announcements.actions.save')}
            </LoadingButton>
          </Stack>
        </Stack>
      </Form>
    </Drawer>
  );
}
