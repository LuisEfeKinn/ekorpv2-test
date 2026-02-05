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
  GetCompetenciesByIdService,
  SaveOrUpdateCompetenciesService
} from 'src/services/architecture/catalogs/competencies.service';

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
  description: string;
  code: string;
  type: string;
};

// ----------------------------------------------------------------------

export function CompetenciesTableModal({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('catalogs');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    code: '',
    type: ''
  });

  // Cargar datos cuando se abre el modal en modo edición
  const loadData = useCallback(async () => {
    if (!dataId) return;

    setLoading(true);
    try {
      const response = await GetCompetenciesByIdService(dataId);
      if (response?.data?.data) {
        const data = response.data.data;
        setFormData({
          name: data.name || '',
          description: data.description || '',
          code: data.code || '',
          type: data.type || '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('competencies.messages.error.loading'));
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
          description: '',
          code: '',
          type: ''
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
      toast.error(t('competencies.messages.error.validation'));
      return;
    }

    setSaving(true);
    try {
      await SaveOrUpdateCompetenciesService(formData, dataId);
      toast.success(
        dataId
          ? t('competencies.messages.success.updated')
          : t('competencies.messages.success.created')
      );
      onSave(); // Recargar la tabla
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(
        dataId
          ? t('competencies.messages.error.updating')
          : t('competencies.messages.error.creating')
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
          ? t('competencies.dialogs.edit.title')
          : t('competencies.dialogs.create.title')}
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
              label={t('competencies.columns.name')}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={saving}
            />
            <TextField
              fullWidth
              label={t('competencies.columns.description')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={4}
              required
              disabled={saving}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label={t('competencies.columns.code')}
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                required
                disabled={saving}
              />
              <TextField
                fullWidth
                label={t('competencies.columns.type')}
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                required
                disabled={saving}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('competencies.actions.cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={loading || !isFormValid()}
        >
          {dataId
            ? t('competencies.actions.update')
            : t('competencies.actions.save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
