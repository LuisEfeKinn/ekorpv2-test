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
  GetProviderByIdService,
  SaveOrUpdateProviderService,
} from 'src/services/architecture/catalogs/providers.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DrawerProps & {
  open: boolean;
  onClose: () => void;
  dataId?: string;
  onSave: () => void;
};

type FormData = {
  name: string; contact: string; supportName: string; supportEmail: string;
  supportPhone: string; contractualName: string; contractualEmail: string; contractualPhone: string;
  color: string;
};

// ----------------------------------------------------------------------

export function ProvidersTableDrawer({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('catalogs');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({ name: '', contact: '', supportName: '', supportEmail: '', supportPhone: '', contractualName: '', contractualEmail: '', contractualPhone: '', color: '' });

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const loadData = useCallback(async () => {
    if (!dataId) return;
    setLoading(true);
    try {
      const response = await GetProviderByIdService(dataId);
      if (response?.data?.data) {
        const data = response.data.data;
        setFormData({ name: data.name || '', contact: data.contact || '', supportName: data.supportName || '', supportEmail: data.supportEmail || '', supportPhone: data.supportPhone || '', contractualName: data.contractualName || '', contractualEmail: data.contractualEmail || '', contractualPhone: data.contractualPhone || '', color: data.color || '' });
      }
    } catch {
      toast.error(t('providers.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [dataId, t]);

  useEffect(() => {
    if (!open) return;
    if (dataId) { loadData(); return; }
    setFormData({ name: '', contact: '', supportName: '', supportEmail: '', supportPhone: '', contractualName: '', contractualEmail: '', contractualPhone: '', color: '' });
  }, [open, dataId, loadData]);

  const isFormValid = formData.name.trim() !== '' && formData.contact.trim() !== '' && formData.supportName.trim() !== '' && formData.supportEmail.trim() !== '' && formData.supportPhone.trim() !== '' && formData.contractualName.trim() !== '' && formData.contractualEmail.trim() !== '' && formData.contractualPhone.trim() !== '';

  const handleSave = async () => {
    if (!isFormValid) { toast.error(t('providers.messages.error.validation')); return; }
    setSaving(true);
    try {
      await SaveOrUpdateProviderService(formData, dataId);
      toast.success(dataId ? t('providers.messages.success.updated') : t('providers.messages.success.created'));
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(dataId ? (error?.message?.[0] || t('providers.messages.error.updating')) : (error?.message?.[0] || t('providers.messages.error.creating')));
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
            {dataId ? t('providers.dialogs.edit.title') : t('providers.dialogs.create.title')}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3}>
              <TextField fullWidth required disabled={saving} label={t('providers.columns.name')} value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
              <TextField fullWidth required disabled={saving} label={t('providers.columns.contact')} value={formData.contact} onChange={(e) => handleChange('contact', e.target.value)} />
              <TextField fullWidth required disabled={saving} label={t('providers.columns.supportName')} value={formData.supportName} onChange={(e) => handleChange('supportName', e.target.value)} />
              <TextField fullWidth required disabled={saving} type="email" label={t('providers.columns.supportEmail')} value={formData.supportEmail} onChange={(e) => handleChange('supportEmail', e.target.value)} />
              <TextField fullWidth required disabled={saving} label={t('providers.columns.supportPhone')} value={formData.supportPhone} onChange={(e) => handleChange('supportPhone', e.target.value)} />
              <TextField fullWidth required disabled={saving} label={t('providers.columns.contractualName')} value={formData.contractualName} onChange={(e) => handleChange('contractualName', e.target.value)} />
              <TextField fullWidth required disabled={saving} type="email" label={t('providers.columns.contractualEmail')} value={formData.contractualEmail} onChange={(e) => handleChange('contractualEmail', e.target.value)} />
              <TextField fullWidth required disabled={saving} label={t('providers.columns.contractualPhone')} value={formData.contractualPhone} onChange={(e) => handleChange('contractualPhone', e.target.value)} />
              <Box>
                <Box sx={{ mb: 1 }}>
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    {t('providers.columns.color')}
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
            </Stack>
          )}
        </Box>

        <Box sx={{ pt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={saving}>{t('providers.actions.cancel')}</Button>
          <LoadingButton variant="contained" onClick={handleSave} loading={saving} disabled={loading || !isFormValid}>
            {dataId ? t('providers.actions.update') : t('providers.actions.save')}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  );
}
