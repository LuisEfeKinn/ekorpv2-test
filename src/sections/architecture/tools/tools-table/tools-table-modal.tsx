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
  GetToolsTableByIdService,
  SaveOrUpdateToolsTableService,
  GetToolsTablePaginationService,
} from 'src/services/architecture/tools/toolsTable.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DialogProps & {
  open: boolean;
  onClose: () => void;
  toolId?: string;
  onSave: () => void;
};

type FormData = {
  name: string;
  description: string;
  code: string;
  superiorToolId?: number | null;
};

// ----------------------------------------------------------------------

export function ToolsTableModal({ open, onClose, toolId, onSave, ...other }: Props) {
  const { t } = useTranslate('architecture');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    code: '',
    superiorToolId: null,
  });
  const [parentOptions, setParentOptions] = useState<any[]>([]);


  // Cargar datos cuando se abre el modal en modo edición
  const loadRiskData = useCallback(async () => {
    if (!toolId) return;

    setLoading(true);
    try {
      const response = await GetToolsTableByIdService(toolId);
      if (response?.data) {
        const data = response.data.data || response.data;
        setFormData({
          name: data.name || '',
          description: data.description || '',
          code: data.code || '',
          superiorToolId: Number(data?.superiorTool?.id) || null,
        });
      }
    } catch (error) {
      console.error('Error loading tools data:', error);
      toast.error(t('tools.table.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [toolId, t]);

  const loadParentTools = useCallback(async () => {
    try {
      const res = await GetToolsTablePaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data;
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

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {

      if (toolId) {
        loadRiskData();
      } else {
        // Resetear formulario para modo creación
        setFormData({
          name: '',
          description: '',
          code: '',
          superiorToolId: null,
        });
      }
      loadParentTools();
    }
  }, [open, toolId, loadRiskData, loadParentTools]);

  // Manejar cambios en los campos
  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => {
      if (field === 'riskType.name') {
        return {
          ...prev,
          riskType: {
            name: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  }, []);

  // Validar formulario
  const isFormValid = () =>
    formData.name.trim() !== '' &&
    formData.description.trim() !== '' &&
    formData.code.trim() !== '';

  // Guardar o actualizar
  const handleSave = async () => {
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
      if (formData.superiorToolId) payload.superiorTool = { id: Number(formData.superiorToolId) };
      await SaveOrUpdateToolsTableService(payload, toolId);
      toast.success(
        toolId
          ? t('tools.table.messages.success.updated')
          : t('tools.table.messages.success.created')
      );
      onSave(); // Recargar la tabla
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error saving tools:', error);
      toast.error(
        toolId
          ? t('tools.table.messages.error.updating')
          : t('tools.table.messages.error.creating')
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
        {toolId
          ? t('tools.table.dialogs.edit.title')
          : t('tools.table.dialogs.create.title')}
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

            {/* Superior Tool */}
            <TextField
              fullWidth
              label={t('tools.table.table.columns.superiorTool')}
              value={parentOptions.find((o) => o.id === formData.superiorToolId)?.label || ''}
              onChange={() => void 0}
              disabled
            />
            {/* Simple selector: autocomplete-like via select list in future; use a plain input now */}
            <TextField
              fullWidth
              type="number"
              label={t('tools.table.table.columns.superiorToolId')}
              value={formData.superiorToolId ?? ''}
              onChange={(e) => setFormData((p) => ({ ...p, superiorToolId: e.target.value ? Number(e.target.value) : null }))}
              disabled={saving}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('tools.table.actions.cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={loading || !isFormValid()}
        >
          {toolId
            ? t('tools.table.actions.update')
            : t('tools.table.actions.save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
