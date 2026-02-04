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
  GetInfraestructureTableByIdService,
  SaveOrUpdateInfraestructureTableService
} from 'src/services/architecture/infrastructure/infrastructureTable.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DialogProps & {
  open: boolean;
  onClose: () => void;
  infrastructureId?: string;
  onSave: () => void;
};

type FormData = {
  name: string;
  description: string;
  nomenclature: string;
  code: string;
  requiresSla: boolean;
  hasSla: boolean;
  sla: boolean;
};

// ----------------------------------------------------------------------

export function InfrastructureTableModal({ open, onClose, infrastructureId, onSave, ...other }: Props) {
  const { t } = useTranslate('architecture');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    nomenclature: '',
    code: '',
    requiresSla: false,
    hasSla: false,
    sla: false,
  });

  // Cargar datos cuando se abre el modal en modo edición
  const loadData = useCallback(async () => {
    if (!infrastructureId) return;

    setLoading(true);
    try {
      const response = await GetInfraestructureTableByIdService(infrastructureId);
      if (response?.data) {
        const data = response.data;
        setFormData({
          name: data.name || '',
          description: data.description || '',
          nomenclature: data.nomenclature || '',
          code: data.code || '',
          requiresSla: data.requiresSla || false,
          hasSla: data.hasSla || false,
          sla: data.sla || false,
        });
      }
    } catch (error) {
      console.error('Error loading application data:', error);
      toast.error(t('infrastructure.table.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [infrastructureId, t]);

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (infrastructureId) {
        loadData();
      } else {
        // Resetear formulario para modo creación
        setFormData({
          name: '',
          description: '',
          nomenclature: '',
          code: '',
          requiresSla: false,
          hasSla: false,
          sla: false,
        });
      }
    }
  }, [open, infrastructureId, loadData]); // [open, infrastructureId, loadData]

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
      toast.error(t('infrastructure.table.messages.error.validation'));
      return;
    }

    setSaving(true);
    try {
      await SaveOrUpdateInfraestructureTableService(formData, infrastructureId);
      toast.success(
        infrastructureId
          ? t('infrastructure.table.messages.success.updated')
          : t('infrastructure.table.messages.success.created')
      );
      onSave(); // Recargar la tabla
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error saving infrastructure table:', error);
      toast.error(
        infrastructureId
          ? t('infrastructure.table.messages.error.updating')
          : t('infrastructure.table.messages.error.creating')
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
        {infrastructureId
          ? t('infrastructure.table.dialogs.edit.title')
          : t('infrastructure.table.dialogs.create.title')}
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
              label={t('infrastructure.table.table.columns.name')}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={saving}
            />

            <TextField
              fullWidth
              label={t('infrastructure.table.table.columns.description')}
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
                label={t('infrastructure.table.table.columns.nomenclature')}
                value={formData.nomenclature}
                onChange={(e) => handleChange('nomenclature', e.target.value)}
                required
                disabled={saving}
              />

              <TextField
                fullWidth
                label={t('infrastructure.table.table.columns.code')}
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
                    checked={formData.requiresSla}
                    onChange={(e) => handleChange('requiresSla', e.target.checked)}
                    disabled={saving}
                  />
                }
                label={t('infrastructure.table.table.columns.requiresSla')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasSla}
                    onChange={(e) => handleChange('hasSla', e.target.checked)}
                    disabled={saving}
                  />
                }
                label={t('infrastructure.table.table.columns.hasSla')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.sla}
                    onChange={(e) => handleChange('sla', e.target.checked)}
                    disabled={saving}
                  />
                }
                label={t('infrastructure.table.table.columns.sla')}
              />
            </Box>

          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('infrastructure.table.actions.cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={loading || !isFormValid()}
        >
          {infrastructureId
            ? t('infrastructure.table.actions.update')
            : t('infrastructure.table.actions.save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
