'use client';

import type { IBoardColumn } from 'src/types/project-management';

import { z } from 'zod';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import {
  CreateBoardColumnService,
  UpdateBoardColumnService,
} from 'src/services/project-management/board.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ColorPicker } from 'src/components/color-utils';

// ----------------------------------------------------------------------

const PRESET_COLORS = [
  '#3B82F6',
  '#22C55E',
  '#EF4444',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
];

const ColumnSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().min(1),
  isCompletion: z.boolean(),
});

type ColumnFormData = z.infer<typeof ColumnSchema>;

type Props = {
  open: boolean;
  boardId: number;
  column?: IBoardColumn | null;
  nextOrder: number;
  onClose: () => void;
  onSuccess: () => void;
};

// ----------------------------------------------------------------------

export function BoardColumnDrawer({ open, boardId, column, nextOrder, onClose, onSuccess }: Props) {
  const { t } = useTranslate('project-management');
  const isEdit = !!column;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ColumnFormData>({
    resolver: zodResolver(ColumnSchema),
    defaultValues: { name: '', color: '#3B82F6', isCompletion: false },
  });

  useEffect(() => {
    if (open) {
      reset(
        column
          ? { name: column.name, color: column.color, isCompletion: column.isCompletion }
          : { name: '', color: '#3B82F6', isCompletion: false }
      );
    }
  }, [open, column, reset]);

  const selectedColor = watch('color');
  const isCustomColor = !PRESET_COLORS.includes(selectedColor);

  const onSubmit = async (data: ColumnFormData) => {
    try {
      if (isEdit) {
        await UpdateBoardColumnService(Number(column!.id), data);
      } else {
        await CreateBoardColumnService({ boardId, ...data, order: nextOrder });
      }
      toast.success(isEdit ? t('detail.tasks.column.columnUpdated') : t('detail.tasks.column.columnCreated'));
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || (isEdit ? t('detail.tasks.column.columnErrorUpdate') : t('detail.tasks.column.columnErrorCreate')));
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 400 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          position: 'relative',
          borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
        }}
      >
        <Typography variant="h6">{isEdit ? t('detail.tasks.column.edit') : t('detail.tasks.column.addColumn')}</Typography>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          px: 3,
          py: 2.5,
          overflow: 'auto',
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Nombre"
              inputProps={{ maxLength: 100 }}
              error={!!errors.name}
              helperText={errors.name?.type === 'too_big' ? 'Máximo 100 caracteres' : errors.name ? 'El nombre es requerido' : undefined}
            />
          )}
        />

        <Controller
          name="color"
          control={control}
          render={({ field }) => (
            <Box>
              <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Color
              </Typography>

              <Stack direction="row" alignItems="center" spacing={1}>
                {/* Preset swatches using the existing ColorPicker component */}
                <ColorPicker
                  options={PRESET_COLORS}
                  value={field.value}
                  onChange={(v) => field.onChange(v as string)}
                  size={44}
                />

                {/* Custom color: circle that shows the selected color and opens native picker */}
                <Box
                  component="label"
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    flexShrink: 0,
                    cursor: 'pointer',
                    bgcolor: isCustomColor ? selectedColor : 'background.neutral',
                    border: '1.5px dashed',
                    borderColor: isCustomColor ? selectedColor : 'text.disabled',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.1s',
                    outline: isCustomColor ? '3px solid' : 'none',
                    outlineColor: isCustomColor ? selectedColor : 'transparent',
                    outlineOffset: 2,
                    '&:hover': { transform: 'scale(1.15)' },
                  }}
                >
                  {!isCustomColor && (
                    <Iconify
                      icon="solar:eye-bold"
                      width={13}
                      sx={{ color: 'text.disabled', pointerEvents: 'none' }}
                    />
                  )}
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => field.onChange(e.target.value)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                      border: 'none',
                      padding: 0,
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          )}
        />

        <Controller
          name="isCompletion"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Estado de finalización
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Las actividades en este estado se marcan como completadas.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mt: 0.5 }}
            />
          )}
        />
      </Box>

      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.25,
        }}
      >
        <Button onClick={onClose} color="inherit" variant="outlined">
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          loading={isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </Box>
    </Drawer>
  );
}
