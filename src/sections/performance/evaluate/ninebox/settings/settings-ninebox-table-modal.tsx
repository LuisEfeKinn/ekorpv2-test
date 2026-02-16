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

import { useTranslate } from 'src/locales';
import { SaveNineBoxSettingsService } from 'src/services/performance/ninebox-settings.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DialogProps & {
  row: any;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
};

type FormData = {
  label: string;
  color: string;
  description: string;
  recommendedAction: string;
  minScoreX: number;
  maxScoreX: number;
};

// ----------------------------------------------------------------------

export function SettingsNineBoxTableModal({ row, open, onClose, onSave, ...other }: Props) {
  const { t } = useTranslate('performance');

  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    label: row?.label || '',
    color: row?.color || '#000000',
    description: row?.description || '',
    recommendedAction: row?.recommendedAction || '',
    minScoreX: row?.minScoreX || 0,
    maxScoreX: row?.maxScoreX || 0,
  });

  // Actualizar formData cuando cambia el row
  useEffect(() => {
    if (open && row) {
      setFormData({
        label: row.label || '',
        color: row.color || '#000000',
        description: row.description || '',
        recommendedAction: row.recommendedAction || '',
        minScoreX: row.minScoreX || 0,
        maxScoreX: row.maxScoreX || 0,
      });
    }
  }, [open, row]);

  // Manejar cambios en los campos
  const handleChange = useCallback((field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Validar formulario
  const isFormValid = () =>
    formData.label.trim() !== '' &&
    formData.color.trim() !== '';

  // Guardar o actualizar
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error(t('nine-box-settings.messages.error.validation'));
      return;
    }

    if (!row?.boxNumber) {
      toast.error(t('nine-box-settings.messages.error.validation'));
      return;
    }

    setSaving(true);
    try {
      await SaveNineBoxSettingsService(formData, row.boxNumber);
      toast.success(t('nine-box-settings.messages.success.updated'));
      onSave(); // Recargar la tabla
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(t('nine-box-settings.messages.error.updating'));
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
        {t('nine-box-settings.dialogs.edit.title')}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              fullWidth
              label={t('nine-box-settings.columns.label')}
              value={formData.label}
              onChange={(e) => handleChange('label', e.target.value)}
              required
              disabled={saving}
            />

            <Box>
              <TextField
                fullWidth
                label={t('nine-box-settings.columns.color')}
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
          </Box>

          <TextField
            fullWidth
            label={t('nine-box-settings.columns.description')}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={saving}
            multiline
            rows={3}
          />

          <TextField
            fullWidth
            label={t('nine-box-settings.columns.recommendedAction')}
            value={formData.recommendedAction}
            onChange={(e) => handleChange('recommendedAction', e.target.value)}
            disabled={saving}
            multiline
            rows={3}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              fullWidth
              label={t('nine-box-settings.columns.minScoreX')}
              value={formData.minScoreX}
              onChange={(e) => handleChange('minScoreX', Number(e.target.value))}
              disabled={saving}
              type="number"
              inputProps={{ min: 0 }}
            />

            <TextField
              fullWidth
              label={t('nine-box-settings.columns.maxScoreX')}
              value={formData.maxScoreX}
              onChange={(e) => handleChange('maxScoreX', Number(e.target.value))}
              disabled={saving}
              type="number"
              inputProps={{ min: 0 }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('nine-box-settings.actions.cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={!isFormValid()}
        >
          {t('nine-box-settings.actions.update')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
