import type { DrawerProps } from '@mui/material/Drawer';

import { useRef, useState, useEffect, useCallback } from 'react';

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
  GetDomainByIdService,
  SaveOrUpdateDomainService,
} from 'src/services/architecture/catalogs/domains.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DrawerProps & {
  open: boolean;
  onClose: () => void;
  dataId?: string;
  onSave: () => void;
};

type FormData = { name: string; code: string; color: string; corporateScope: string; owner: string; admin: string };

// ----------------------------------------------------------------------

export function DomainsTableDrawer({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('catalogs');

  const colorInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({ name: '', code: '', color: '', corporateScope: '', owner: '', admin: '' });

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const loadData = useCallback(async () => {
    if (!dataId) return;
    setLoading(true);
    try {
      const response = await GetDomainByIdService(dataId);
      if (response?.data?.data) {
        const data = response.data.data;
        setFormData({ name: data.name || '', code: data.code || '', color: data.color || '', corporateScope: data.corporateScope || '', owner: data.owner || '', admin: data.admin || '' });
      }
    } catch {
      toast.error(t('domains.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [dataId, t]);

  useEffect(() => {
    if (!open) return;
    if (dataId) { loadData(); return; }
    setFormData({ name: '', code: '', color: '', corporateScope: '', owner: '', admin: '' });
  }, [open, dataId, loadData]);

  const isFormValid = formData.name.trim() !== '';

  const handleSave = async () => {
    if (!isFormValid) { toast.error(t('domains.messages.error.validation')); return; }
    setSaving(true);
    try {
      await SaveOrUpdateDomainService(formData, dataId);
      toast.success(dataId ? t('domains.messages.success.updated') : t('domains.messages.success.created'));
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(dataId ? (error?.message?.[0] || t('domains.messages.error.updating')) : (error?.message?.[0] || t('domains.messages.error.creating')));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { if (!saving) onClose(); };

  return (
    <Drawer anchor="right" open={open} onClose={handleClose} {...other} PaperProps={{ sx: { width: { xs: '100%', sm: 560 } } }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">
            {dataId ? t('domains.dialogs.edit.title') : t('domains.dialogs.create.title')}
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
                label={t('domains.columns.name')}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              <TextField
                fullWidth required disabled={saving}
                label={t('domains.columns.code')}
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
              />
              <TextField
                fullWidth required disabled={saving}
                label={t('domains.columns.corporateScope')}
                value={formData.corporateScope}
                onChange={(e) => handleChange('corporateScope', e.target.value)}
              />
              <Box>
                <Box sx={{ mb: 1 }}>
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    {t('domains.columns.color')} <span style={{ color: 'red' }}>*</span>
                  </span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, padding: '12px 16px', border: '1px solid', borderColor: 'divider', borderRadius: 1, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', boxShadow: '0 0 8px rgba(0,0,0,0.1)' }, backgroundColor: 'background.paper' }}>
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={formData.color || '#000000'}
                    onChange={(e) => handleChange('color', e.target.value)}
                    disabled={saving}
                    style={{ width: 40, height: 40, border: '2px solid #e0e0e0', borderRadius: 4, cursor: 'pointer', padding: 0 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <span style={{ fontSize: '0.875rem', color: '#999' }}>{formData.color || 'Seleccionar color'}</span>
                  </Box>
                </Box>
              </Box>
              <TextField
                fullWidth required disabled={saving}
                label={t('domains.columns.owner')}
                value={formData.owner}
                onChange={(e) => handleChange('owner', e.target.value)}
              />
              <TextField
                fullWidth required disabled={saving}
                label={t('domains.columns.admin')}
                value={formData.admin}
                onChange={(e) => handleChange('admin', e.target.value)}
              />
            </Stack>
          )}
        </Box>

        <Box sx={{ pt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={saving}>{t('domains.actions.cancel')}</Button>
          <LoadingButton variant="contained" onClick={handleSave} loading={saving} disabled={loading || !isFormValid}>
            {dataId ? t('domains.actions.update') : t('domains.actions.save')}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  );
}
