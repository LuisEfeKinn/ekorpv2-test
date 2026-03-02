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
  GetObjectiveTypeByIdService,
  SaveOrUpdateObjectiveTypeService
} from 'src/services/architecture/catalogs/objectiveTypes.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DrawerProps & {
  open: boolean;
  onClose: () => void;
  dataId?: string | number;
  onSave: () => void;
};

type FormData = {
  typeName: string;
  typeCode: string;
};

// ----------------------------------------------------------------------

export function ObjectiveTypesTableDrawer({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('catalogs');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    typeName: '',
    typeCode: ''
  });

  // Load data when opening in edit mode
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

  // Effect to load data when opening
  useEffect(() => {
    if (open) {
      if (dataId) {
        loadData();
      } else {
        // Reset form for creation mode
        setFormData({
          typeName: '',
          typeCode: ''
        });
      }
    }
  }, [open, dataId, loadData]);

  // Handle field changes
  const handleChange = useCallback((field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Validate form
  const isFormValid = () =>
    formData.typeName.trim() !== '' &&
    formData.typeCode.trim() !== '';

  // Save or update
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error(t('objective-types.messages.error.validation'));
      return;
    }

    setSaving(true);
    try {
      await SaveOrUpdateObjectiveTypeService(formData, dataId ? Number(dataId) : undefined);
      toast.success(
        dataId
          ? t('objective-types.messages.success.updated')
          : t('objective-types.messages.success.created')
      );
      onSave(); // Reload table
      onClose(); // Close drawer
    } catch (error: any) {
      console.error('Error saving data:', error);
      toast.error(
        dataId
          ? (error?.message[0] || t('objective-types.messages.error.updating'))
          : (error?.message[0] || t('objective-types.messages.error.creating'))
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle drawer close
  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      {...other}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 480 } }
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">
            {dataId
              ? t('objective-types.dialogs.edit.title')
              : t('objective-types.dialogs.create.title')}
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
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
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label={t('objective-types.columns.typeName')}
                value={formData.typeName}
                onChange={(e) => handleChange('typeName', e.target.value.slice(0, 256))}
                required
                disabled={saving}
                inputProps={{ maxLength: 256 }}
              />
              <TextField
                fullWidth
                label={t('objective-types.columns.typeCode')}
                value={formData.typeCode}
                onChange={(e) => handleChange('typeCode', e.target.value.slice(0, 80))}
                required
                disabled={saving}
                inputProps={{ maxLength: 80 }}
              />
            </Stack>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ pt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
        </Box>
      </Box>
    </Drawer>
  );
}