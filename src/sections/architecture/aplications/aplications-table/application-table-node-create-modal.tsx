'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';

import { useTranslate } from 'src/locales';
import { SaveApplicationTableMapCreateNodeService } from 'src/services/architecture/applications/applicationMap.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type NodeFormData = {
  name: string;
  nomenclature?: string;
};

type ApplicationTableNodeCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  applicationId: string;
  parentNodeId: string;
  sx?: SxProps<Theme>;
};

// ----------------------------------------------------------------------

export function ApplicationTableNodeCreateModal({
  open,
  onClose,
  onSuccess,
  applicationId,
  parentNodeId,
  sx,
}: ApplicationTableNodeCreateModalProps) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NodeFormData>({
    defaultValues: {
      name: '',
      nomenclature: '',
    },
  });

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  const onSubmit = async (data: NodeFormData) => {
    try {
      setLoading(true);

      await SaveApplicationTableMapCreateNodeService(applicationId, parentNodeId, {
        name: data.name,
        nomenclature: data.nomenclature || '',
      });

      toast.success(t('application.table.messages.success.created'));
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al crear el nodo:', error);
      toast.error(t('application.table.messages.error.creating'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      anchor="right"
      PaperProps={{
        sx: {
          width: { xs: 1, sm: 480, md: 560 },
          ...sx,
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="solar:add-circle-bold" width={24} />
          <Typography variant="h6">{t('application.table.actions.add')}</Typography>
        </Stack>

        <IconButton onClick={handleClose} disabled={loading} aria-label={t('application.table.actions.cancel')}>
          <Iconify icon="solar:close-circle-bold" />
        </IconButton>
      </Stack>

      <Divider />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={3}>
          <TextField
            {...register('name', {
              required: t('application.table.form.fields.name.required'),
            })}
            label={t('application.table.form.fields.name.label')}
            placeholder={t('application.table.form.fields.name.label')}
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
            autoFocus
            disabled={loading}
          />

          <TextField
            {...register('nomenclature', {
              required: t('application.table.form.fields.nomenclature.required'),
            })}
            label={t('application.table.form.fields.nomenclature.label')}
            placeholder={t('application.table.form.fields.nomenclature.label')}
            error={!!errors.nomenclature}
            helperText={errors.nomenclature?.message}
            fullWidth
            disabled={loading}
          />

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button variant="outlined" color="inherit" onClick={handleClose} disabled={loading}>
              {t('application.table.actions.cancel')}
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={loading}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              {t('application.table.actions.save')}
            </LoadingButton>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
