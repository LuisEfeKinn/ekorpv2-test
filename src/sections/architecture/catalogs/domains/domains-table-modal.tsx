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
  GetDomainByIdService,
  SaveOrUpdateDomainService
} from 'src/services/architecture/catalogs/domains.service';

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
  code: string;
  color: string;
  corporateScope: string;
  owner: string;
  admin: string;
};

// ----------------------------------------------------------------------

export function DomainsTableModal({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('catalogs');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    color: '',
    corporateScope: '',
    owner: '',
    admin: ''
  });

  // Cargar datos cuando se abre el modal en modo edición
  const loadData = useCallback(async () => {
    if (!dataId) return;

    setLoading(true);
    try {
      const response = await GetDomainByIdService(dataId);
      if (response?.data?.data) {
        const data = response.data.data;
        setFormData({
          name: data.name || '',
          code: data.code || '',
          color: data.color || '',
          corporateScope: data.corporateScope || '',
          owner: data.owner || '',
          admin: data.admin || ''
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('domains.messages.error.loading'));
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
          code: '',
          color: '',
          corporateScope: '',
          owner: '',
          admin: ''
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
    formData.name.trim() !== '';

  // Guardar o actualizar
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error(t('domains.messages.error.validation'));
      return;
    }

    setSaving(true);
    try {
      await SaveOrUpdateDomainService(formData, dataId);
      toast.success(
        dataId
          ? t('domains.messages.success.updated')
          : t('domains.messages.success.created')
      );
      onSave(); // Recargar la tabla
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(
        dataId
          ? t('domains.messages.error.updating')
          : t('domains.messages.error.creating')
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
          ? t('domains.dialogs.edit.title')
          : t('domains.dialogs.create.title')}
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
                label={t('domains.columns.name')}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                disabled={saving}
              />
              <TextField
                fullWidth
                label={t('domains.columns.code')}
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                required
                disabled={saving}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label={t('domains.columns.corporateScope')}
                value={formData.corporateScope}
                onChange={(e) => handleChange('corporateScope', e.target.value)}
                required
                disabled={saving}
              />
              <TextField
                fullWidth
                label={t('domains.columns.color')}
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                required
                disabled={saving}
                type="color"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        backgroundColor: formData.color || '#000000',
                        border: '1px solid',
                        borderColor: 'divider',
                        mr: 1,
                      }}
                    />
                  ),
                }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label={t('domains.columns.owner')}
                value={formData.owner}
                onChange={(e) => handleChange('owner', e.target.value)}
                required
                disabled={saving}
              />
              <TextField
                fullWidth
                label={t('domains.columns.admin')}
                value={formData.admin}
                onChange={(e) => handleChange('admin', e.target.value)}
                required
                disabled={saving}
              />
            </Box>

          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('domains.actions.cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={loading || !isFormValid()}
        >
          {dataId
            ? t('domains.actions.update')
            : t('domains.actions.save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
