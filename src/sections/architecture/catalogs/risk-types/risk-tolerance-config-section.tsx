import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';

import { useTranslate } from 'src/locales';
import { GetRiskToleranceLevelsService, SaveOrUpdateRiskToleranceLevelService } from 'src/services/architecture/catalogs/riskTypes.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  riskTypeId: string | number;
};

export function RiskToleranceConfigSection({ riskTypeId }: Props) {
  const { t, currentLang } = useTranslate('catalogs');
  
  const tf = useCallback((key: string, en: string, es?: string) => {
    const v = t(key);
    if (v && v !== key) return v;
    return currentLang?.value === 'es' ? (es ?? en) : en;
  }, [t, currentLang]);

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ levelName: '', toleranceColor: '#43a047', initialRange: '', finalRange: '' });

  const loadList = useCallback(async () => {
    if (!riskTypeId) return;
    setLoading(true);
    try {
      const res = await GetRiskToleranceLevelsService({ risktype: riskTypeId });
      const raw = (res as any)?.data ?? res;
      let data: any[] = [];
      if (Array.isArray(raw)) {
        data = Array.isArray(raw[0]) ? raw[0] : raw;
      } else if (raw?.data && Array.isArray(raw.data)) {
        data = raw.data;
      } else if (raw?.items && Array.isArray(raw.items)) {
        data = raw.items;
      }
      
      setList(data);
    } catch (error) {
      console.error(error);
      toast.error(tf('common.error.loading', 'Error loading data', 'Error al cargar datos'));
    } finally {
      setLoading(false);
    }
  }, [riskTypeId, tf]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      levelName: item.levelName,
      toleranceColor: item.toleranceColor,
      initialRange: String(item.initialRange),
      finalRange: String(item.finalRange)
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm({ levelName: '', toleranceColor: '#43a047', initialRange: '', finalRange: '' });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.levelName) {
      toast.error(tf('common.required', 'Name is required', 'El nombre es requerido'));
      return;
    }
    
    setSaving(true);
    try {
      await SaveOrUpdateRiskToleranceLevelService({
        ...form,
        riskTypeId: Number(riskTypeId),
        initialRange: Number(form.initialRange),
        finalRange: Number(form.finalRange)
      }, editingId);
      
      toast.success(tf('common.success', 'Saved successfully', 'Guardado exitosamente'));
      handleCancel();
      loadList();
    } catch (error) {
      console.error(error);
      toast.error(tf('common.error.save', 'Error saving data', 'Error al guardar'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ mt: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {tf('risk-types.tolerance.title', 'Risk Tolerance Levels', 'Niveles de tolerancia al riesgo')}
        </Typography>
        {!showForm && (
          <Button size="small" variant="soft" startIcon={<Iconify icon="mingcute:add-line" />} onClick={handleAdd}>
            {tf('common.add', 'Add', 'Agregar')}
          </Button>
        )}
      </Stack>

      {showForm ? (
        <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
          <Stack spacing={2}>
            <TextField 
              label={tf('risk-types.tolerance.fields.name', 'Name', 'Nombre')} 
              value={form.levelName} 
              onChange={(e) => setForm({...form, levelName: e.target.value})} 
              size="small"
              fullWidth
            />
            <Stack direction="row" spacing={2}>
               <TextField 
                label={tf('risk-types.tolerance.fields.initial', 'Initial Range', 'Rango Inicial')} 
                value={form.initialRange} 
                onChange={(e) => setForm({...form, initialRange: e.target.value})} 
                size="small"
                type="number"
                fullWidth
              />
              <TextField 
                label={tf('risk-types.tolerance.fields.final', 'Final Range', 'Rango Final')} 
                value={form.finalRange} 
                onChange={(e) => setForm({...form, finalRange: e.target.value})} 
                size="small"
                type="number"
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 40, height: 40, bgcolor: form.toleranceColor, borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
               <TextField 
                label={tf('risk-types.tolerance.fields.color', 'Color', 'Color')} 
                value={form.toleranceColor} 
                onChange={(e) => setForm({...form, toleranceColor: e.target.value})} 
                size="small"
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button size="small" onClick={handleCancel} disabled={saving}>
                {tf('common.cancel', 'Cancel', 'Cancelar')}
              </Button>
              <LoadingButton size="small" variant="contained" onClick={handleSave} loading={saving}>
                {tf('common.save', 'Save', 'Guardar')}
              </LoadingButton>
            </Stack>
          </Stack>
        </Box>
      ) : (
        <List dense disablePadding sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {loading ? (
            <ListItem>
              <ListItemText primary={tf('common.loading', 'Loading...', 'Cargando...')} />
            </ListItem>
          ) : (
            list.map((item) => (
              <ListItem key={item.id} divider sx={{ py: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: item.toleranceColor, borderRadius: '50%', mr: 2, flexShrink: 0 }} />
                <ListItemText 
                  primary={item.levelName} 
                  secondary={`${item.initialRange} - ${item.finalRange}`}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                />
                <ListItemSecondaryAction>
                  <IconButton size="small" onClick={() => handleEdit(item)}>
                    <Iconify icon="solar:pen-bold" width={16} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
          {!loading && list.length === 0 && (
            <ListItem>
              <ListItemText 
                secondary={tf('common.noData', 'No tolerance levels defined', 'No hay niveles de tolerancia definidos')} 
                sx={{ textAlign: 'center', py: 2 }}
              />
            </ListItem>
          )}
        </List>
      )}
    </Box>
  );
}
