import type { IClient } from 'src/types/project-management';

import { z } from 'zod';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateClientService } from 'src/services/project-management/client.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  currentRow: IClient | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function ClientsCreateEditDrawer({ open, currentRow, onClose, onSuccess }: Props) {
  const { t } = useTranslate('project-management');
  const isEdit = !!currentRow;

  const ClientSchema = z.object({
    nit: z.string().min(1, t('clients.drawer.validation.nitRequired')),
    name: z.string().min(1, t('clients.drawer.validation.nameRequired')),
    email: z.string().email(t('clients.drawer.validation.emailInvalid')),
    isActive: z.boolean(),
  });

  type ClientFormData = z.infer<typeof ClientSchema>;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(ClientSchema),
    defaultValues: { nit: '', name: '', email: '', isActive: true },
  });

  useEffect(() => {
    if (open) {
      reset(
        currentRow
          ? { nit: currentRow.nit, name: currentRow.name, email: currentRow.email, isActive: currentRow.isActive }
          : { nit: '', name: '', email: '', isActive: true }
      );
    }
  }, [open, currentRow, reset]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      await SaveOrUpdateClientService(data, currentRow?.id);
      toast.success(isEdit ? t('clients.messages.updated') : t('clients.messages.created'));
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || (isEdit ? t('clients.messages.errorUpdate') : t('clients.messages.errorCreate')));
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 480 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          position: 'relative',
          borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
        }}
      >
        <Typography variant="h6">
          {isEdit ? t('clients.drawer.titleEdit') : t('clients.drawer.titleCreate')}
        </Typography>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ px: 3, py: 2.5, overflow: 'auto', flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('clients.drawer.fields.name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />

        <Controller
          name="nit"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('clients.drawer.fields.nit')}
              error={!!errors.nit}
              helperText={errors.nit?.message}
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('clients.drawer.fields.email')}
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />

        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              }
              label={t('clients.drawer.fields.isActive')}
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
          {t('clients.actions.cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          loading={isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          {isEdit ? t('clients.actions.save') : t('clients.actions.create')}
        </Button>
      </Box>
    </Drawer>
  );
}
