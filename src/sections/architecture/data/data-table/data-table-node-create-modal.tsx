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
import { SaveDataTableMapCreateNodeService } from 'src/services/architecture/data/dataMap.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type NodeFormData = {
  name: string;
  nomenclature?: string;
};

type DataTableNodeCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dataId: string;
  parentNodeId: string;
  sx?: SxProps<Theme>;
};

// ----------------------------------------------------------------------

export function DataTableNodeCreateModal({
  open,
  onClose,
  onSuccess,
  dataId,
  parentNodeId,
  sx,
}: DataTableNodeCreateModalProps) {
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

      await SaveDataTableMapCreateNodeService(dataId, parentNodeId, {
        name: data.name,
        nomenclature: data.nomenclature || '',
      });

      toast.success(t('data.table.messages.success.created'));
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al crear el nodo:', error);
      toast.error(t('data.table.messages.error.creating'));
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
          <Typography variant="h6">{t('data.table.actions.add')}</Typography>
        </Stack>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              {...register('name', {
                required: t('data.table.form.fields.name.required'),
              })}
              label={t('data.table.form.fields.name.label')}
              placeholder={t('data.table.form.fields.name.label')}
              error={!!errors.name}
              helperText={errors.name?.message}
              fullWidth
              autoFocus
              disabled={loading}
            />

            <TextField
              {...register('nomenclature', {
                required: t('data.table.form.fields.nomenclature.required'),
              })}
              label={t('data.table.form.fields.nomenclature.label')}
              placeholder={t('data.table.form.fields.nomenclature.label')}
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
            {t('data.table.actions.cancel')}
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={loading}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            {t('data.table.actions.save')}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
