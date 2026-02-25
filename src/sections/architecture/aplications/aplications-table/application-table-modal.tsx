import type { DialogProps } from '@mui/material/Dialog';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  GetApplicationTableByIdService,
  SaveOrUpdateApplicationTableService
} from 'src/services/architecture/applications/applicationTable.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DialogProps & {
  open: boolean;
  onClose: () => void;
  applicationId?: string;
  onSave: () => void;
};

type FormData = {
  name: string;
  description: string;
  code: string;
  nomenclature: string;
  architecture: boolean;
  requiresSla: boolean;
  hasSla: boolean;
  sla: boolean;
};

// ----------------------------------------------------------------------

export function ApplicationTableModal({ open, onClose, applicationId, onSave, ...other }: Props) {
  const { t } = useTranslate('architecture');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    code: '',
    nomenclature: '',
    architecture: false,
    requiresSla: false,
    hasSla: false,
    sla: false,
  });

  // Cargar datos cuando se abre el modal en modo edición
  const loadapplicationData = useCallback(async () => {
    if (!applicationId) return;

    setLoading(true);
    try {
      const response = await GetApplicationTableByIdService(applicationId);
      if (response?.data) {
        const data = response.data;
        setFormData({
          name: data.name || '',
          description: data.description || '',
          code: data.code || '',
          nomenclature: data.nomenclature || '',
          architecture: data.architecture || false,
          requiresSla: data.requiresSla || false,
          hasSla: data.hasSla || false,
          sla: data.sla || false,
        });
      }
    } catch (error) {
      console.error('Error loading application data:', error);
      toast.error(t('application.table.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [applicationId, t]);

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (applicationId) {
        loadapplicationData();
      } else {
        // Resetear formulario para modo creación
        setFormData({
          name: '',
          description: '',
          code: '',
          nomenclature: '',
          architecture: false,
          requiresSla: false,
          hasSla: false,
          sla: false,
        });
      }
    }
  }, [open, applicationId, loadapplicationData]); // [open, applicationId, loadapplicationData]

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
    formData.description.trim() !== '' &&
    formData.code.trim() !== '' &&
    formData.nomenclature.trim() !== '';

  // Guardar o actualizar
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error(t('application.table.messages.error.validation'));
      return;
    }

    setSaving(true);
    try {
      await SaveOrUpdateApplicationTableService(formData, applicationId);
      toast.success(
        applicationId
          ? t('application.table.messages.success.updated')
          : t('application.table.messages.success.created')
      );
      onSave(); // Recargar la tabla
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error saving application:', error);
      toast.error(
        applicationId
          ? t('application.table.messages.error.updating')
          : t('application.table.messages.error.creating')
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
        {applicationId
          ? t('application.table.dialogs.edit.title')
          : t('application.table.dialogs.create.title')}
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
            <TextField
              fullWidth
              label={t('application.table.table.columns.name')}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={saving}
            />

            <TextField
              fullWidth
              label={t('application.table.table.columns.description')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
              required
              disabled={saving}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label={t('application.table.table.columns.nomenclature')}
                value={formData.nomenclature}
                onChange={(e) => handleChange('nomenclature', e.target.value)}
                required
                disabled={saving}
              />

              <TextField
                fullWidth
                label={t('application.table.table.columns.code')}
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                required
                disabled={saving}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.architecture}
                    onChange={(e) => handleChange('architecture', e.target.checked)}
                    disabled={saving}
                  />
                }
                label={t('application.table.table.columns.architecture')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresSla}
                    onChange={(e) => handleChange('requiresSla', e.target.checked)}
                    disabled={saving}
                  />
                }
                label={t('application.table.table.columns.requiresSla')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasSla}
                    onChange={(e) => handleChange('hasSla', e.target.checked)}
                    disabled={saving}
                  />
                }
                label={t('application.table.table.columns.hasSla')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.sla}
                    onChange={(e) => handleChange('sla', e.target.checked)}
                    disabled={saving}
                  />
                }
                label={t('application.table.table.columns.sla')}
              />
            </Box>

          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('application.table.actions.cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={loading || !isFormValid()}
        >
          {applicationId
            ? t('application.table.actions.update')
            : t('application.table.actions.save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
