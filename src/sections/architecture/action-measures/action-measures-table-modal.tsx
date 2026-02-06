import type { DialogProps } from '@mui/material/Dialog';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { GetProvidersPaginationService } from 'src/services/architecture/catalogs/providers.service';
import { GetActionMeasuresService, CreateActionMeasureService, UpdateActionMeasureService, GetActionMeasureByIdService } from 'src/services/architecture/actionMeasures.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DialogProps & {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  dataId?: string;
};

type FormData = {
  name: string;
  description: string;
  measureType: number;
  resultType: number;
  code: string;
  providerId: number;
  superiorActionMeasureId: number;
};

// ----------------------------------------------------------------------

export function ActionMeasuresTableModal({ open, onClose, onSave, dataId, ...other }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [providers, setProviders] = useState<any[]>([]);
  const [actionMeasuresList, setActionMeasuresList] = useState<any[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    measureType: 1,
    resultType: 1,
    code: '',
    providerId: 0,
    superiorActionMeasureId: 0,
  });

  const loadCatalogs = useCallback(async () => {
    try {
      const [providersRes, actionMeasuresRes] = await Promise.all([
        GetProvidersPaginationService({ perPage: 1000 }),
        GetActionMeasuresService(),
      ]);

      const providersResponse = providersRes as any;
      const actionMeasuresResponse = actionMeasuresRes as any;

      console.log('Providers response:', providersResponse);

      // Robust extraction for providers matching ProvidersView logic
      const providersData = 
        providersResponse?.data?.[0] || 
        providersResponse?.data?.data || 
        providersResponse?.data || 
        [];

      console.log('Extracted providers:', providersData);

      const actionMeasuresData = Array.isArray(actionMeasuresResponse?.data) 
        ? actionMeasuresResponse?.data 
        : (actionMeasuresResponse?.data?.data || []);

      setProviders(Array.isArray(providersData) ? providersData : []);
      setActionMeasuresList(Array.isArray(actionMeasuresData) ? actionMeasuresData : []);

    } catch (error) {
      console.error('Error loading catalogs:', error);
      toast.error('Error al cargar catálogos');
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!dataId) return;

    setLoading(true);
    try {
      console.log('Loading data for ID:', dataId);
      const response = await GetActionMeasureByIdService(dataId);
      const data = response.data;
      
      console.log('GetActionMeasureByIdService response:', response);

      // Robust data extraction
      let item = data;
      if (data && typeof data === 'object' && 'data' in data) {
        item = data.data;
      }
      
      // Fallback for double nesting if necessary (common issue)
      if (item && typeof item === 'object' && 'data' in item) {
        item = item.data;
      }

      console.log('Final extracted item:', item);

      if (item) {
          setFormData({
            name: item.name || '',
            description: item.description || '',
            measureType: item.measureType ?? 1,
            resultType: item.resultType ?? 1,
            code: item.code || '',
            providerId: item.provider?.id || 0,
            superiorActionMeasureId: item.superiorActionMeasure?.id || 0,
          });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [dataId]);

  // Load catalogs when modal opens
  useEffect(() => {
    if (open) {
      loadCatalogs();
    }
  }, [open, loadCatalogs]);

  // Reset or load form when modal opens
  useEffect(() => {
    if (open) {
      if (dataId) {
        loadData();
      } else {
        setFormData({
          name: '',
          description: '',
          measureType: 1,
          resultType: 1,
          code: '',
          providerId: 0,
          superiorActionMeasureId: 0,
        });
      }
    }
  }, [open, dataId, loadData]);

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Nombre y Código son requeridos');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        measureType: Number(formData.measureType),
        resultType: Number(formData.resultType),
        code: formData.code,
        provider: formData.providerId ? { id: Number(formData.providerId) } : null,
        superiorActionMeasure: formData.superiorActionMeasureId ? { id: Number(formData.superiorActionMeasureId) } : null,
      };

      console.log('Saving with dataId:', dataId);

      if (dataId) {
        console.log('Calling UpdateActionMeasureService');
        await UpdateActionMeasureService(dataId, payload);
        toast.success('Action Measure actualizado exitosamente');
      } else {
        console.log('Calling CreateActionMeasureService');
        await CreateActionMeasureService(payload);
        toast.success('Action Measure creado exitosamente');
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving action measure:', error);
      toast.error(dataId ? 'Error al actualizar Action Measure' : 'Error al crear Action Measure');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      {...other}
    >
      <DialogTitle>{dataId ? 'Editar Action Measure' : 'Crear Action Measure'}</DialogTitle>

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
              label="Nombre"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={saving}
            />

            <TextField
              fullWidth
              label="Descripción"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={saving}
            />

            <TextField
              fullWidth
              label="Código"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              required
              disabled={saving}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                type="number"
                label="Measure Type"
                value={formData.measureType}
                onChange={(e) => handleChange('measureType', Number(e.target.value))}
                disabled={saving}
              />
              <TextField
                fullWidth
                type="number"
                label="Result Type"
                value={formData.resultType}
                onChange={(e) => handleChange('resultType', Number(e.target.value))}
                disabled={saving}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                select
                label="Provider"
                value={formData.providerId}
                onChange={(e) => handleChange('providerId', Number(e.target.value))}
                disabled={saving}
                SelectProps={{
                  native: false,
                }}
              >
                <MenuItem value={0} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  Ninguno
                </MenuItem>
                {providers.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name || option.tradename || option.businessName || `ID: ${option.id}`}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                select
                label="Superior Action Measure"
                value={formData.superiorActionMeasureId}
                onChange={(e) => handleChange('superiorActionMeasureId', Number(e.target.value))}
                disabled={saving}
                SelectProps={{
                  native: false,
                }}
              >
                <MenuItem value={0} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  Ninguna
                </MenuItem>
                {actionMeasuresList
                  .filter((item) => String(item.id) !== dataId) // Evitar seleccionarse a sí mismo
                  .map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name || `ID: ${option.id}`}
                    </MenuItem>
                  ))}
              </TextField>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
        >
          Guardar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
