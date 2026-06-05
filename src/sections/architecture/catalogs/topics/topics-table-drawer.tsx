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
  GetTopicByIdService,
  SaveOrUpdateTopicService,
} from 'src/services/architecture/catalogs/topics.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DrawerProps & {
  open: boolean;
  onClose: () => void;
  dataId?: string;
  onSave: () => void;
};

type FormData = { name: string };

// ----------------------------------------------------------------------

export function TopicsTableDrawer({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('catalogs');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({ name: '' });

  const loadData = useCallback(async () => {
    if (!dataId) return;
    setLoading(true);
    try {
      const response = await GetTopicByIdService(dataId);
      if (response?.data?.data) {
        setFormData({ name: response.data.data.name || '' });
      }
    } catch {
      toast.error(t('topics.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [dataId, t]);

  useEffect(() => {
    if (!open) return;
    if (dataId) { loadData(); return; }
    setFormData({ name: '' });
  }, [open, dataId, loadData]);

  const isFormValid = formData.name.trim() !== '';

  const handleSave = async () => {
    if (!isFormValid) { toast.error(t('topics.messages.error.validation')); return; }
    setSaving(true);
    try {
      await SaveOrUpdateTopicService(formData, dataId);
      toast.success(dataId ? t('topics.messages.success.updated') : t('topics.messages.success.created'));
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(dataId ? (error?.message?.[0] || t('topics.messages.error.updating')) : (error?.message?.[0] || t('topics.messages.error.creating')));
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
            {dataId ? t('topics.dialogs.edit.title') : t('topics.dialogs.create.title')}
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
                label={t('topics.columns.name')}
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
              />
            </Stack>
          )}
        </Box>

        <Box sx={{ pt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={saving}>{t('topics.actions.cancel')}</Button>
          <LoadingButton variant="contained" onClick={handleSave} loading={saving} disabled={loading || !isFormValid}>
            {dataId ? t('topics.actions.update') : t('topics.actions.save')}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  );
}
