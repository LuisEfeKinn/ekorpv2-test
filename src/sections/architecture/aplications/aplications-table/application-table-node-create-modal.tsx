'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

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
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          ...sx,
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="solar:add-circle-bold" width={24} />
          <Typography variant="h6">{t('application.table.actions.add')}</Typography>
        </Stack>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
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
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleClose}
            disabled={loading}
          >
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
        </DialogActions>
      </form>
    </Dialog>
  );
}
