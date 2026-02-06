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
  GetObjectiveTypeByIdService,
  SaveOrUpdateObjectiveTypeService
} from 'src/services/architecture/catalogs/objectiveTypes.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DialogProps & {
  open: boolean;
  onClose: () => void;
  dataId?: string;
  onSave: () => void;
};

type FormData = {
  typeName: string;
  typeCode: string;
  // sla: boolean;
};

// ----------------------------------------------------------------------

export function ObjectiveTypesTableModal({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('catalogs');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    typeName: '',
    typeCode: ''
    // sla: false,
  });

  // Cargar datos cuando se abre el modal en modo edición
  const loadData = useCallback(async () => {
    if (!dataId) return;

    setLoading(true);
    try {
      const response = await GetObjectiveTypeByIdService(dataId);
      if (response?.data?.data) {
        const data = response.data.data;
        setFormData({
          typeName: data.typeName || '',
          typeCode: data.typeCode || ''
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('objective-types.messages.error.loading'));
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
          typeName: '',
          typeCode: ''
          // sla: false,
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
    formData.typeName.trim() !== '' &&
    formData.typeCode.trim() !== '';

  // Guardar o actualizar
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error(t('objective-types.messages.error.validation'));
      return;
    }

    setSaving(true);
    try {
      await SaveOrUpdateObjectiveTypeService(formData, dataId);
      toast.success(
        dataId
          ? t('objective-types.messages.success.updated')
          : t('objective-types.messages.success.created')
      );
      onSave(); // Recargar la tabla
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(
        dataId
          ? t('objective-types.messages.error.updating')
          : t('objective-types.messages.error.creating')
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
          ? t('objective-types.dialogs.edit.title')
          : t('objective-types.dialogs.create.title')}
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
              label={t('objective-types.columns.typeName')}
              value={formData.typeName}
              onChange={(e) => handleChange('typeName', e.target.value)}
              required
              disabled={saving}
            />
            <TextField
              fullWidth
              label={t('objective-types.columns.typeCode')}
              value={formData.typeCode}
              onChange={(e) => handleChange('typeCode', e.target.value)}
              required
              disabled={saving}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('objective-types.actions.cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={loading || !isFormValid()}
        >
          {dataId
            ? t('objective-types.actions.update')
            : t('objective-types.actions.save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
