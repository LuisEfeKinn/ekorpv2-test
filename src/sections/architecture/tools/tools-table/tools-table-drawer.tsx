'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetToolTypesPaginationService } from 'src/services/architecture/catalogs/toolTypes.service';
import {
  GetToolsTableByIdService,
  SaveOrUpdateToolsTableService,
  GetToolsTablePaginationService,
} from 'src/services/architecture/tools/toolsTable.service';

import { toast } from 'src/components/snackbar';

type Props = {
  open: boolean;
  onClose: () => void;
  toolId?: string;
  onSave: () => void;
};

type Option = {
  id: number;
  label: string;
};

type FormData = {
  name: string;
  description: string;
  code: string;
  toolTypeId?: number | null;
  superiorToolId?: number | null;
};

export function ToolsTableDrawer({ open, onClose, toolId, onSave }: Props) {
  const { t } = useTranslate('architecture');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    code: '',
    toolTypeId: null,
    superiorToolId: null,
  });
  const [toolTypeOptions, setToolTypeOptions] = useState<Option[]>([]);
  const [parentOptions, setParentOptions] = useState<Option[]>([]);

  const loadTool = useCallback(async () => {
    if (!toolId) return;
    setLoading(true);
    try {
      const response = await GetToolsTableByIdService(toolId);
      const data = (response as any)?.data?.data ?? (response as any)?.data ?? {};
      const toolTypeId = Number((data as any)?.toolType?.id ?? (data as any)?.riskType?.id) || null;
      setFormData({
        name: data.name || '',
        description: data.description || '',
        code: data.code || '',
        toolTypeId,
        superiorToolId: Number(data?.superiorTool?.id) || null,
      });
    } catch (error) {
      console.error(error);
      toast.error(t('tools.table.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [toolId, t]);

  const loadToolTypes = useCallback(async () => {
    try {
      const res = await GetToolTypesPaginationService({ page: 1, perPage: 1000 });
      const raw = (res as any)?.data;
      let list: any[] = [];
      if (Array.isArray(raw)) {
        list = Array.isArray(raw[0]) ? raw[0] : raw.filter((it) => typeof it === 'object' && it);
      } else if (Array.isArray((res as any)?.data?.data)) {
        list = (res as any).data.data;
      }
      const opts = (Array.isArray(list) ? list : [])
        .map((it: any) => ({ id: Number(it?.id), label: String(it?.name || it?.code || `#${it?.id}`) }))
        .filter((it) => Number.isFinite(it.id) && it.id > 0);
      setToolTypeOptions(opts);
    } catch {
      setToolTypeOptions([]);
    }
  }, []);

  const loadParentTools = useCallback(async () => {
    try {
      const res = await GetToolsTablePaginationService({ page: 1, perPage: 1000 });
      const raw = (res as any)?.data;
      let list: any[] = [];
      if (Array.isArray(raw)) {
        list = Array.isArray(raw[0]) ? raw[0] : raw.filter((it) => typeof it === 'object' && it);
      } else if (Array.isArray((res as any)?.data?.data)) {
        list = (res as any).data.data;
      }
      const opts = (Array.isArray(list) ? list : [])
        .map((it: any) => ({ id: Number(it?.id), label: String(it?.name || it?.code || `#${it?.id}`) }))
        .filter((it) => Number.isFinite(it.id));
      setParentOptions(opts);
    } catch {
      setParentOptions([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      if (toolId) {
        loadTool();
      } else {
        setFormData({ name: '', description: '', code: '', toolTypeId: null, superiorToolId: null });
      }
      loadToolTypes();
      loadParentTools();
    }
  }, [open, toolId, loadTool, loadToolTypes, loadParentTools]);

  const handleChange = useCallback((field: keyof FormData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }));
  }, []);

  const isFormValid = useCallback(
    () => formData.name.trim() !== '' && formData.description.trim() !== '' && formData.code.trim() !== '',
    [formData.name, formData.description, formData.code],
  );

  const handleSave = useCallback(async () => {
    if (!isFormValid()) {
      toast.error(t('tools.table.messages.error.validation'));
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        code: formData.code,
      };
      if (formData.toolTypeId) payload.toolType = { id: Number(formData.toolTypeId) };
      if (formData.superiorToolId) payload.superiorTool = { id: Number(formData.superiorToolId) };
      await SaveOrUpdateToolsTableService(payload, toolId);
      toast.success(toolId ? t('tools.table.messages.success.updated') : t('tools.table.messages.success.created'));
      onSave();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(toolId ? t('tools.table.messages.error.updating') : t('tools.table.messages.error.creating'));
    } finally {
      setSaving(false);
    }
  }, [formData, onClose, onSave, t, toolId, isFormValid]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 520 } }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {toolId ? t('tools.table.dialogs.edit.title') : t('tools.table.dialogs.create.title')}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            <TextField
              fullWidth
              label={t('tools.table.table.columns.name')}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={saving}
            />

            <TextField
              fullWidth
              label={t('tools.table.table.columns.description')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
              required
              disabled={saving}
            />

            <TextField
              fullWidth
              label={t('tools.table.table.columns.code')}
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              required
              disabled={saving}
            />

          <Autocomplete
            fullWidth
            options={toolTypeOptions}
            getOptionLabel={(option: Option) => option.label}
            value={toolTypeOptions.find((opt) => opt.id === formData.toolTypeId) || null}
            onChange={(_, newValue: Option | null) =>
              handleChange('toolTypeId', newValue ? newValue.id : null)
            }
            isOptionEqualToValue={(option: Option, value: Option) => option.id === value.id}
            disabled={saving}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('tools.table.form.fields.riskType.label')}
                placeholder={t('tools.table.form.fields.riskType.placeholder')}
              />
            )}
          />

          <Autocomplete
            fullWidth
            options={parentOptions}
            getOptionLabel={(option: Option) => option.label}
            value={parentOptions.find((opt) => opt.id === formData.superiorToolId) || null}
            onChange={(_, newValue: Option | null) =>
              handleChange('superiorToolId', newValue ? newValue.id : null)
            }
            isOptionEqualToValue={(option: Option, value: Option) => option.id === value.id}
            disabled={saving}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('tools.table.form.fields.superiorRisk.label')}
                placeholder={t('tools.table.form.fields.superiorRisk.placeholder')}
              />
            )}
          />

            <Stack direction="row" spacing={1.5} sx={{ pt: 2 }}>
              <Button variant="outlined" onClick={onClose} disabled={saving} fullWidth>
                {t('tools.table.actions.cancel')}
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={saving || !isFormValid()} fullWidth>
                {toolId ? t('tools.table.actions.update') : t('tools.table.actions.save')}
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
