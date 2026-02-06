import type { DialogProps } from '@mui/material/Dialog';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  GetProviderByIdService,
  SaveOrUpdateProviderService
} from 'src/services/architecture/catalogs/providers.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DialogProps & {
  open: boolean;
  onClose: () => void;
  dataId?: string;
  onSave: () => void;
};

type FormData = {
  name: string;
  contact: string;
  supportName: string;
  supportEmail: string;
  supportPhone: string;
  contractualName: string;
  contractualEmail: string;
  contractualPhone: string;
};

// ----------------------------------------------------------------------

export function ProvidersTableModal({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('catalogs');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    contact: '',
    supportName: '',
    supportEmail: '',
    supportPhone: '',
    contractualName: '',
    contractualEmail: '',
    contractualPhone: ''
  });

  // Cargar datos cuando se abre el modal en modo edición
  const loadData = useCallback(async () => {
    if (!dataId) return;

    setLoading(true);
    try {
      const response = await GetProviderByIdService(dataId);
      if (response?.data?.data) {
        const data = response.data.data;
        setFormData({
          name: data.name || '',
          contact: data.contact || '',
          supportName: data.supportName || '',
          supportEmail: data.supportEmail || '',
          supportPhone: data.supportPhone || '',
          contractualName: data.contractualName || '',
          contractualEmail: data.contractualEmail || '',
          contractualPhone: data.contractualPhone || ''
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('providers.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [dataId, t]);

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (dataId) {
        loadData();
      } else {
        // Resetear formulario para modo creación
        setFormData({
          name: '',
          contact: '',
          supportName: '',
          supportEmail: '',
          supportPhone: '',
          contractualName: '',
          contractualEmail: '',
          contractualPhone: ''
        });
      }
    }
  }, [open, dataId, loadData]); // [open, dataId, loadData]

  // Manejar cambios en los campos
  const handleChange = useCallback((field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Validar formulario
  const isFormValid = () =>
    formData.name.trim() !== '' &&
    formData.contact.trim() !== '' &&
    formData.supportName.trim() !== '' &&
    formData.supportEmail.trim() !== '' &&
    formData.supportPhone.trim() !== '' &&
    formData.contractualName.trim() !== '' &&
    formData.contractualEmail.trim() !== '' &&
    formData.contractualPhone.trim() !== '';

  // Guardar o actualizar
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error(t('providers.messages.error.validation'));
      return;
    }

    setSaving(true);
    try {
      await SaveOrUpdateProviderService(formData, dataId);
      toast.success(
        dataId
          ? t('providers.messages.success.updated')
          : t('providers.messages.success.created')
      );
      onSave(); // Recargar la tabla
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(
        dataId
          ? t('providers.messages.error.updating')
          : t('providers.messages.error.creating')
      );
    } finally {
      setSaving(false);
    }
  };

  // Manejar cierre del modal
  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      {...other}
    >
      <DialogTitle>
        {dataId
          ? t('providers.dialogs.edit.title')
          : t('providers.dialogs.create.title')}
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 300,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label={t('providers.columns.name')}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                disabled={saving}
              />
              <TextField
                fullWidth
                label={t('providers.columns.contact')}
                value={formData.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
                required
                disabled={saving}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label={t('providers.columns.supportName')}
                value={formData.supportName}
                onChange={(e) => handleChange('supportName', e.target.value)}
                required
                disabled={saving}
              />
              <TextField
                type='email'
                fullWidth
                label={t('providers.columns.supportEmail')}
                value={formData.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                required
                disabled={saving}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                type='phone'
                fullWidth
                label={t('providers.columns.supportPhone')}
                value={formData.supportPhone}
                onChange={(e) => handleChange('supportPhone', e.target.value)}
                required
                disabled={saving}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label={t('providers.columns.contractualName')}
                value={formData.contractualName}
                onChange={(e) => handleChange('contractualName', e.target.value)}
                required
                disabled={saving}
              />
              <TextField
                type='email'
                fullWidth
                label={t('providers.columns.contractualEmail')}
                value={formData.contractualEmail}
                onChange={(e) => handleChange('contractualEmail', e.target.value)}
                required
                disabled={saving}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                type='phone'
                fullWidth
                label={t('providers.columns.contractualPhone')}
                value={formData.contractualPhone}
                onChange={(e) => handleChange('contractualPhone', e.target.value)}
                required
                disabled={saving}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('providers.actions.cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={loading || !isFormValid()}
        >
          {dataId
            ? t('providers.actions.update')
            : t('providers.actions.save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
