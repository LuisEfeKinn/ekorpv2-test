import type { DrawerProps } from '@mui/material/Drawer';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  GetProcessTypeByIdService,
  SaveOrUpdateProcessTypeService,
} from 'src/services/architecture/catalogs/processTypes.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DrawerProps & {
  open: boolean;
  onClose: () => void;
  dataId?: string;
  onSave: () => void;
};

type FormData = { name: string; level: number };

// ----------------------------------------------------------------------

export function ProcessTypesTableDrawer({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('catalogs');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({ name: '', level: 0 });

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const loadData = useCallback(async () => {
    if (!dataId) return;
    setLoading(true);
    try {
      const response = await GetProcessTypeByIdService(dataId);
      if (response?.data?.data) {
        const data = response.data.data;
        setFormData({ name: data.name || '', level: data.level || 0 });
      }
    } catch {
      toast.error(t('process-types.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [dataId, t]);

  useEffect(() => {
    if (!open) return;
    if (dataId) { loadData(); return; }
    setFormData({ name: '', level: 0 });
  }, [open, dataId, loadData]);

  const isFormValid = formData.name.trim() !== '' && formData.level !== 0;

  const handleSave = async () => {
    if (!isFormValid) { toast.error(t('process-types.messages.error.validation')); return; }
    setSaving(true);
    try {
      await SaveOrUpdateProcessTypeService(formData, dataId);
      toast.success(dataId ? t('process-types.messages.success.updated') : t('process-types.messages.success.created'));
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(dataId ? (error?.message?.[0] || t('process-types.messages.error.updating')) : (error?.message?.[0] || t('process-types.messages.error.creating')));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { if (!saving) onClose(); };

  return (
    <Drawer anchor="right" open={open} onClose={handleClose} {...other} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">
            {dataId ? t('process-types.dialogs.edit.title') : t('process-types.dialogs.create.title')}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3}>
              <TextField
                fullWidth required disabled={saving}
                label={t('process-types.columns.name')}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              <TextField
                fullWidth required disabled={saving} type="number"
                label={t('process-types.columns.level')}
                value={formData.level}
                onChange={(e) => handleChange('level', e.target.value)}
              />
            </Stack>
          )}
        </Box>

        <Box sx={{ pt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={saving}>{t('process-types.actions.cancel')}</Button>
          <LoadingButton variant="contained" onClick={handleSave} loading={saving} disabled={loading || !isFormValid}>
            {dataId ? t('process-types.actions.update') : t('process-types.actions.save')}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  );
}
