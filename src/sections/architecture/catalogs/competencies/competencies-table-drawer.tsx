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
  GetCompetenciesByIdService,
  SaveOrUpdateCompetenciesService,
} from 'src/services/architecture/catalogs/competencies.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DrawerProps & {
  open: boolean;
  onClose: () => void;
  dataId?: string;
  onSave: () => void;
};

type FormData = { name: string; description: string; code: string; type: string };

// ----------------------------------------------------------------------

export function CompetenciesTableDrawer({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('catalogs');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({ name: '', description: '', code: '', type: '' });

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const loadData = useCallback(async () => {
    if (!dataId) return;
    setLoading(true);
    try {
      const response = await GetCompetenciesByIdService(dataId);
      if (response?.data?.data) {
        const data = response.data.data;
        setFormData({ name: data.name || '', description: data.description || '', code: data.code || '', type: data.type || '' });
      }
    } catch {
      toast.error(t('competencies.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [dataId, t]);

  useEffect(() => {
    if (!open) return;
    if (dataId) { loadData(); return; }
    setFormData({ name: '', description: '', code: '', type: '' });
  }, [open, dataId, loadData]);

  const isFormValid = formData.name.trim() !== '';

  const handleSave = async () => {
    if (!isFormValid) { toast.error(t('competencies.messages.error.validation')); return; }
    setSaving(true);
    try {
      await SaveOrUpdateCompetenciesService(formData, dataId);
      toast.success(dataId ? t('competencies.messages.success.updated') : t('competencies.messages.success.created'));
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(dataId ? (error?.message?.[0] || t('competencies.messages.error.updating')) : (error?.message?.[0] || t('competencies.messages.error.creating')));
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
            {dataId ? t('competencies.dialogs.edit.title') : t('competencies.dialogs.create.title')}
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
                label={t('competencies.columns.name')}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              <TextField
                fullWidth required disabled={saving} multiline rows={4}
                label={t('competencies.columns.description')}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              <TextField
                fullWidth required disabled={saving}
                label={t('competencies.columns.code')}
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
              />
              <TextField
                fullWidth required disabled={saving}
                label={t('competencies.columns.type')}
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
              />
            </Stack>
          )}
        </Box>

        <Box sx={{ pt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={saving}>{t('competencies.actions.cancel')}</Button>
          <LoadingButton variant="contained" onClick={handleSave} loading={saving} disabled={loading || !isFormValid}>
            {dataId ? t('competencies.actions.update') : t('competencies.actions.save')}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  );
}
