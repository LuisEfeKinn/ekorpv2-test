import type { DialogProps } from '@mui/material/Dialog';

import { useRef, useState, useEffect, useCallback } from 'react';

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
  GetOrganizationalUnitTypeByIdService,
  SaveOrUpdateOrganizationalUnitTypeService
} from 'src/services/architecture/catalogs/organizationalUnitTypes.service';

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
  background: string;
  internalExternal: boolean;
  letter: string;
};

// ----------------------------------------------------------------------

export function OrganizationalUnitTypesTableModal({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('catalogs');

  const colorInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    background: '',
    internalExternal: false,
    letter: '',
  });

  // Cargar datos cuando se abre el modal en modo edición
  const loadData = useCallback(async () => {
    if (!dataId) return;

    setLoading(true);
    try {
      const response = await GetOrganizationalUnitTypeByIdService(dataId);
      if (response?.data?.data) {
        const data = response.data.data;
        setFormData({
          name: data.name || '',
          background: data.background || '',
          internalExternal: data.internalExternal || false,
          letter: data.letter || '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('organizational-unit-types.messages.error.loading'));
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
          background: '',
          internalExternal: false,
          letter: '',
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
      toast.error(t('organizational-unit-types.messages.error.validation'));
      return;
    }

    setSaving(true);
    try {
      await SaveOrUpdateOrganizationalUnitTypeService(formData, dataId);
      toast.success(
        dataId
          ? t('organizational-unit-types.messages.success.updated')
          : t('organizational-unit-types.messages.success.created')
      );
      onSave(); // Recargar la tabla
      onClose(); // Cerrar el modal
    } catch (error: any) {
      console.error('Error saving data:', error);
      toast.error(
        dataId
          ? (error?.message[0] || t('organizational-unit-types.messages.error.updating'))
          : (error?.message[0] || t('organizational-unit-types.messages.error.creating'))
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
          ? t('organizational-unit-types.dialogs.edit.title')
          : t('organizational-unit-types.dialogs.create.title')}
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
                label={t('organizational-unit-types.columns.name')}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                disabled={saving}
              />
              <TextField
                fullWidth
                label={t('organizational-unit-types.columns.letter')}
                value={formData.letter}
                onChange={(e) => handleChange('letter', e.target.value)}
                required
                disabled={saving}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.internalExternal}
                    onChange={(e) => handleChange('internalExternal', e.target.checked)}
                    disabled={saving}
                  />
                }
                label={t('organizational-unit-types.columns.internalExternal')}
              />
              <Box>
                <Box sx={{ mb: 1 }}>
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    {t('organizational-unit-types.columns.background')} <span style={{ color: 'red' }}>*</span>
                  </span>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    padding: '12px 16px',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 0 8px rgba(0, 0, 0, 0.1)',
                    },
                    backgroundColor: 'background.paper',
                  }}
                >
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={formData.background || '#000000'}
                    onChange={(e) => handleChange('background', e.target.value)}
                    disabled={saving}
                    style={{
                      width: 40,
                      height: 40,
                      border: '2px solid #e0e0e0',
                      borderRadius: 4,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <span style={{ fontSize: '0.875rem', color: '#999' }}>
                      {formData.background || 'Seleccionar color'}
                    </span>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('organizational-unit-types.actions.cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={loading || !isFormValid()}
        >
          {dataId
            ? t('organizational-unit-types.actions.update')
            : t('organizational-unit-types.actions.save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
