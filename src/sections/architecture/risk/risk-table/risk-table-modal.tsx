import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Stack,
  Drawer,
  Button,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetRiskTypesPaginationService } from 'src/services/architecture/catalogs/riskTypes.service';
import {
  GetRiskTypesService,
  GetRiskTableByIdService,
  SaveOrUpdateRiskTableService,
  GetRiskTablePaginationService,
} from 'src/services/architecture/risk/riskTable.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  riskId?: string;
  onSave: () => void;
};

// type RiskTypeOption = {
//   id: number;
//   name: string;
//   createdBy: string | null;
//   createdDate: string;
//   lastModifiedBy: string | null;
//   lastModifiedDate: string;
// };

type FormData = {
  name: string;
  description: string;
  code: string;
  riskTypeId?: number | null;
  superiorRiskId?: number | null;
};

// ----------------------------------------------------------------------

export function RiskTableModal({ open, onClose, riskId, onSave }: Props) {
  const { t, currentLang } = useTranslate('architecture');
  const tf = useCallback((key: string, en: string, es?: string) => {
    const v = t(key);
    return v && v !== key ? v : (currentLang?.value === 'es' ? (es ?? en) : en);
  }, [t, currentLang]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingRiskTypes, setLoadingRiskTypes] = useState(false);
  const [riskTypeOptions, setRiskTypeOptions] = useState<any[]>([]);
  const [loadingSuperior, setLoadingSuperior] = useState(false);
  const [superiorOptions, setSuperiorOptions] = useState<any[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    code: '',
    riskTypeId: null,
    superiorRiskId: null,
  });

  // Cargar tipos de riesgo
  const loadRiskTypes = useCallback(async () => {
    setLoadingRiskTypes(true);
    try {
      // Primario: /api/risk-types sin parámetros (lista plana o data)
      const res = await GetRiskTypesService();
      const raw = res?.data;
      let listA: any[] = [];
      if (Array.isArray(raw)) {
        // Formato: [ [items], total ]
        listA = Array.isArray(raw[0]) ? raw[0] : raw.filter((it) => typeof it === 'object' && it);
      } else if (Array.isArray((raw as any)?.data)) {
        listA = (raw as any).data;
      }
      let combined = listA;

      // Fallback: paginado /api/risk-types
      try {
        const primary = await GetRiskTypesPaginationService({ page: 1, perPage: 1000 });
        const praw = primary?.data;
        const listB: any[] = Array.isArray(praw)
          ? praw
          : Array.isArray((praw as any)?.data)
            ? (praw as any).data
            : [];
        combined = [...combined, ...listB];
      } catch {
        void 0;
      }

      const normalized = combined
        .map((it: any) => ({ id: Number(it?.id), name: String(String(it?.name ?? '').trim()) }))
        .filter((it) => Number.isFinite(it.id) && !!it.name);
      const unique = Array.from(new Map(normalized.map((o) => [o.id, o])).values());
      setRiskTypeOptions(unique);
    } catch {
      try {
        const primary = await GetRiskTypesPaginationService({});
        const raw = primary?.data;
        const list: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as any)?.data)
            ? (raw as any).data
            : [];
        const normalized = list
          .map((it: any) => ({ id: Number(it?.id), name: String(String(it?.name ?? '').trim()) }))
          .filter((it) => Number.isFinite(it.id) && !!it.name);
        const unique = Array.from(new Map(normalized.map((o) => [o.id, o])).values());
        setRiskTypeOptions(unique);
      } catch (err2) {
        console.error('Error loading risk types:', err2);
        toast.error(tf('risk.table.messages.error.loadingTypes', 'Error loading risk types', 'Error al cargar tipos de riesgo'));
        setRiskTypeOptions([]);
      }
    } finally {
      setLoadingRiskTypes(false);
    }
  }, [tf]);

  const loadSuperiorRisks = useCallback(async (search?: string) => {
    setLoadingSuperior(true);
    try {
      const params = { page: 1, perPage: 50, ...(search ? { search } : {}) };
      const response = await GetRiskTablePaginationService(params);
      const raw = response?.data;
      let list: any[] = [];
      if (Array.isArray(raw)) {
        list = Array.isArray(raw[0]) ? raw[0] : raw.filter((it) => typeof it === 'object' && it);
      } else if (Array.isArray((response as any)?.data?.data)) {
        list = (response as any).data.data;
      } else if (Array.isArray((response as any))) {
        list = (response as any) as any[];
      }
      const normalized = list
        .map((it: any) => ({ id: Number(it?.id), name: String(String(it?.name ?? '').trim()) }))
        .filter((it) => Number.isFinite(it.id) && !!it.name);
      const unique = Array.from(new Map(normalized.map((o) => [o.id, o])).values());
      setSuperiorOptions(unique);
    } catch (error) {
      console.error('Error loading superior risks:', error);
      setSuperiorOptions([]);
    } finally {
      setLoadingSuperior(false);
    }
  }, []);

  // Cargar datos cuando se abre el modal en modo edición
  const loadRiskData = useCallback(async () => {
    if (!riskId) return;

    setLoading(true);
    try {
      const response = await GetRiskTableByIdService(riskId);
      const raw = response?.data;
      const data = (Array.isArray(raw)
        ? (raw[0] || {})
        : (typeof raw === 'object' && raw && 'data' in raw ? (raw as any).data : raw)) || {};

      setFormData({
        name: String(data?.name ?? '').trim(),
        description: String(data?.description ?? '').trim(),
        code: String(data?.code ?? '').trim(),
        riskTypeId: Number(data?.riskType?.id) || null,
        superiorRiskId: Number((data?.risk?.id ?? data?.superiorRisk?.id)) || null,
      });
    } catch (error) {
      console.error('Error loading risk data:', error);
      toast.error(tf('risk.table.messages.error.loading', 'Error loading data', 'Error al cargar datos'));
    } finally {
      setLoading(false);
    }
  }, [riskId, tf]);

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      // Cargar tipos de riesgo
      // loadRiskTypes();

      if (riskId) {
        loadRiskData();
      } else {
        // Resetear formulario para modo creación
        setFormData({
          name: '',
          description: '',
          code: '',
          riskTypeId: null,
          superiorRiskId: null,
        });
      }
      loadRiskTypes();
      loadSuperiorRisks();
    }
  }, [open, riskId, loadRiskData, loadRiskTypes, loadSuperiorRisks]);

  // Manejar cambios en los campos
  const handleChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Validar formulario
  const isFormValid = () =>
    formData.name.trim() !== '' &&
    formData.description.trim() !== '' &&
    formData.code.trim() !== '' &&
    formData.riskTypeId != null;

  // Guardar o actualizar
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error(tf('risk.table.messages.error.validation', 'Complete required fields', 'Completa los campos requeridos'));
      if (formData.riskTypeId == null) {
        toast.error(tf('risk.table.messages.error.missingRiskType', 'Select a risk type', 'Selecciona un tipo de riesgo'));
      }
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        code: formData.code,
      };
      if (formData.riskTypeId != null) {
        payload.riskType = { id: Number(formData.riskTypeId) };
      }
      payload.superiorRisk = formData.superiorRiskId != null
        ? { id: Number(formData.superiorRiskId) }
        : null;

      await SaveOrUpdateRiskTableService(payload, riskId);
      toast.success(
        riskId
          ? tf('risk.table.messages.success.updated', 'Risk updated', 'Riesgo actualizado')
          : tf('risk.table.messages.success.created', 'Risk created', 'Riesgo creado')
      );
      onSave(); // Recargar la tabla
      onClose(); // Cerrar el modal
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Unknown error';
      const status = error?.response?.status;
      console.error('Error saving risk:', { status, message: msg, data: error?.response?.data });
      toast.error(
        riskId
          ? tf('risk.table.messages.error.updating', 'Error updating risk', 'Error al actualizar el riesgo')
          : tf('risk.table.messages.error.creating', 'Error creating risk', 'Error al crear el riesgo')
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
    <Drawer anchor="right" open={open} onClose={handleClose} PaperProps={{ sx: { width: 600 } }}>
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {riskId ? t('risk.table.dialogs.edit.title') : t('risk.table.dialogs.create.title')}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label={t('risk.table.table.columns.name')}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={saving}
            />

            <TextField
              fullWidth
              label={t('risk.table.table.columns.description')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
              required
              disabled={saving}
            />

            <TextField
              fullWidth
              label={t('risk.table.table.columns.code')}
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              required
              disabled={saving}
            />

            <Autocomplete
              fullWidth
              options={riskTypeOptions}
              getOptionLabel={(option) => option.name}
              value={riskTypeOptions.find((opt) => opt.id === formData.riskTypeId) || null}
              onChange={(_, newValue) => handleChange('riskTypeId', newValue?.id ?? null)}
              loading={loadingRiskTypes}
              disabled={saving}
              onOpen={() => { if (!riskTypeOptions.length) loadRiskTypes(); }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              filterOptions={(x) => x}
              renderOption={(props, option) => (
                <li {...props} key={`risktype-${option.id}`}>{option.name}</li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('risk.table.table.columns.riskType')}
                  placeholder={t('risk.table.dialogs.form.riskTypeHelper')}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingRiskTypes ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <Autocomplete
              fullWidth
              options={superiorOptions}
              getOptionLabel={(option) => option.name}
              value={superiorOptions.find((opt) => opt.id === formData.superiorRiskId) || null}
              onChange={(_, newValue) => handleChange('superiorRiskId', newValue?.id ?? null)}
              loading={loadingSuperior}
              disabled={saving}
              onInputChange={(_, val) => {
                const s = (val || '').trim();
                loadSuperiorRisks(s.length >= 2 ? s : undefined);
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              filterOptions={(x) => x}
              renderOption={(props, option) => (
                <li {...props} key={`risk-${option.id}`}>{option.name}</li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('risk.table.table.columns.superiorRisk')}
                  placeholder={t('risk.table.dialogs.form.superiorRiskHelper')}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingSuperior ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Stack>
        )}

        <Stack direction="row" spacing={1} sx={{ pt: 2 }}>
          <Button onClick={handleClose} disabled={saving}>
            {t('risk.table.actions.cancel')}
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleSave}
            loading={saving}
            disabled={loading || !isFormValid()}
          >
            {riskId ? t('risk.table.actions.update') : t('risk.table.actions.save')}
          </LoadingButton>
        </Stack>
      </Box>
    </Drawer>
  );
}
