import type { DrawerProps } from '@mui/material/Drawer';
import type { DocumentTypePayload } from 'src/types/architecture/catalogs/document-types';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LoadingButton } from '@mui/lab';

import { useTranslate } from 'src/locales';
import {
  GetDocumentTypeByIdService,
  SaveOrUpdateDocumentTypeService,
} from 'src/services/architecture/catalogs/documentTypes.service';

import { toast } from 'src/components/snackbar';

type Props = DrawerProps & {
  open: boolean;
  onClose: () => void;
  dataId?: string | number;
  onSave: () => void;
};

type FormState = DocumentTypePayload;

function isDocumentTypePayload(value: unknown): value is DocumentTypePayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.name === 'string' && typeof record.documentCode === 'string';
}

export function DocumentTypesTableDrawer({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('catalogs');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormState>({ name: '', documentCode: '' });

  const title = useMemo(
    () => (dataId ? t('document-types.dialogs.edit.title') : t('document-types.dialogs.create.title')),
    [dataId, t]
  );

  const loadData = useCallback(async () => {
    if (!dataId) return;

    setLoading(true);
    try {
      const response = await GetDocumentTypeByIdService(dataId);
      const payload = response.data?.data;

      if (isDocumentTypePayload(payload)) {
        setFormData({ name: payload.name ?? '', documentCode: payload.documentCode ?? '' });
      } else if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>;
        const name = typeof record.name === 'string' ? record.name : '';
        const documentCode = typeof record.documentCode === 'string' ? record.documentCode : '';
        setFormData({ name, documentCode });
      }
    } catch (error) {
      toast.error(t('document-types.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [dataId, t]);

  useEffect(() => {
    if (!open) return;
    if (dataId) {
      loadData();
      return;
    }
    setFormData({ name: '', documentCode: '' });
  }, [dataId, loadData, open]);

  const isFormValid = formData.name.trim() !== '' && formData.documentCode.trim() !== '';

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!isFormValid) {
      toast.error(t('document-types.messages.error.validation'));
      return;
    }

    setSaving(true);
    try {
      await SaveOrUpdateDocumentTypeService(
        { name: formData.name.trim(), documentCode: formData.documentCode.trim() },
        dataId ? Number(dataId) : undefined
      );

      toast.success(dataId ? t('document-types.messages.success.updated') : t('document-types.messages.success.created'));
      onSave();
      onClose();
    } catch (error) {
      toast.error(t('document-types.messages.error.general'));
    } finally {
      setSaving(false);
    }
  }, [dataId, formData.documentCode, formData.name, isFormValid, onClose, onSave, t]);

  const handleClose = useCallback(() => {
    if (!saving) onClose();
  }, [onClose, saving]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      {...other}
      PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                required
                disabled={saving}
                label={t('document-types.columns.name')}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value.slice(0, 256))}
                inputProps={{ maxLength: 256 }}
              />

              <TextField
                fullWidth
                required
                disabled={saving}
                label={t('document-types.columns.documentCode')}
                value={formData.documentCode}
                onChange={(e) => handleChange('documentCode', e.target.value.slice(0, 80))}
                inputProps={{ maxLength: 80 }}
              />
            </Stack>
          )}
        </Box>

        <Box sx={{ pt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={saving}>
            {t('document-types.actions.cancel')}
          </Button>

          <LoadingButton variant="contained" onClick={handleSave} loading={saving} disabled={loading || !isFormValid}>
            {dataId ? t('document-types.actions.update') : t('document-types.actions.save')}
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  );
}
