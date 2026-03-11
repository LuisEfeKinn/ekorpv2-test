'use client';

import { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Stack,
  Button,
  Drawer,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { useTranslate } from 'src/locales';
import {
  GetControlLevelEnumService,
  GetActionMeasuresListService,
  GetMandatoryRecommendedEnumService,
  SaveRiskActionMeasureRelationService,
  UpdateRiskActionMeasureRelationService
} from 'src/services/architecture/risk/riskActionMeasures.service';

import { toast } from 'src/components/snackbar';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  riskId: string;
  parentNodeId: string;
  relationId?: number;
  initialData?: any;
};

export function RiskTableMeasureCreateModal({ open, onClose, onSuccess, riskId, relationId, initialData }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);
  const [mandatoryList, setMandatoryList] = useState<any[]>([]);
  const [controlLevelList, setControlLevelList] = useState<any[]>([]);
  const [form, setForm] = useState({ actionMeasureId: null as null | number, mandatoryRecommended: null as null | number, controlLevel: null as null | number });
  const [measureList, setMeasureList] = useState<any[]>([]);

  useEffect(() => {
    if (initialData && open) {
      setForm({
        actionMeasureId: initialData.actionMeasure?.id ?? initialData.actionMeasureId ?? null,
        mandatoryRecommended: initialData.mandatoryRecommended?.id ?? initialData.mandatoryRecommendedId ?? initialData.mandatoryRecommended ?? null,
        controlLevel: initialData.controlLevel?.id ?? initialData.controlLevelId ?? initialData.controlLevel ?? null,
      });
    } else if (open) {
      setForm({ actionMeasureId: null, mandatoryRecommended: null, controlLevel: null });
    }
  }, [initialData, open]);

  useEffect(() => {
    const load = async () => {
      try {
        const mr = await GetMandatoryRecommendedEnumService();
        const cl = await GetControlLevelEnumService();
        const mrData = Array.isArray(mr?.data) ? mr.data : mr?.data?.data ?? [];
        const clData = Array.isArray(cl?.data) ? cl.data : cl?.data?.data ?? [];
        setMandatoryList(mrData);
        setControlLevelList(clData);
        // Action measures list
        const am = await GetActionMeasuresListService({ lesson: true });
        const raw = am?.data;
        const list: any[] = Array.isArray(raw)
          ? raw.filter((it) => typeof it === 'object' && it)
          : Array.isArray((am as any)?.data?.data)
            ? (am as any).data.data
            : [];
        setMeasureList(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
      }
    };
    if (open) load();
  }, [open]);

  const mandatoryOptions = useMemo(() => (Array.isArray(mandatoryList) ? mandatoryList : []).map((p: any) => ({ label: p?.label ?? String(p?.value), id: Number(p?.value) })), [mandatoryList]);
  const controlLevelOptions = useMemo(() => (Array.isArray(controlLevelList) ? controlLevelList : []).map((p: any) => ({ label: p?.label ?? String(p?.value), id: Number(p?.value) })), [controlLevelList]);
  const measureOptions = useMemo(() => (Array.isArray(measureList) ? measureList : []).filter((m: any) => m && m.id != null).map((m: any) => ({ id: Number(m.id), label: String(m.name || m.code || `#${m.id}`) })), [measureList]);

  const handleSubmit = async () => {
    if (!form.actionMeasureId || form.mandatoryRecommended == null || form.controlLevel == null) {
      toast.error(t('data.table.actions.save'));
      return;
    }
    const payload = {
      mandatoryRecommended: Number(form.mandatoryRecommended),
      controlLevel: Number(form.controlLevel),
      riskId: Number(riskId),
      actionMeasureId: Number(form.actionMeasureId),
    };
    try {
      setLoading(true);
      if (relationId) {
        await UpdateRiskActionMeasureRelationService(relationId, payload);
        toast.success(t('data.table.actions.update'));
      } else {
        await SaveRiskActionMeasureRelationService(payload);
        toast.success(t('data.table.actions.save'));
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Error';
      const status = e?.response?.status;
      console.error('Error saving risk action measure:', { status, message: msg, data: e?.response?.data });
      toast.error(t('data.table.actions.cancel'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{relationId ? t('riskMap.form.actions.editMeasure') : t('riskMap.form.actions.addMeasure')}</Typography>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={measureOptions}
            value={measureOptions.find((o) => o.id === form.actionMeasureId) || null}
            onChange={(_, v) => setForm((f) => ({ ...f, actionMeasureId: v?.id ?? null }))}
            getOptionLabel={(o) => o?.label ?? ''}
            isOptionEqualToValue={(o, v) => o?.id === v?.id}
            disablePortal
            renderInput={(params) => <TextField {...params} label={t('riskMap.form.fields.measure')} />}
          />
          <Autocomplete
            options={mandatoryOptions}
            value={mandatoryOptions.find((o) => o.id === form.mandatoryRecommended) || null}
            onChange={(_, v) => setForm((f) => ({ ...f, mandatoryRecommended: v?.id ?? null }))}
            renderInput={(params) => <TextField {...params} label={t('riskMap.form.fields.mandatoryRecommended')} />}
          />
          <Autocomplete
            options={controlLevelOptions}
            value={controlLevelOptions.find((o) => o.id === form.controlLevel) || null}
            onChange={(_, v) => setForm((f) => ({ ...f, controlLevel: v?.id ?? null }))}
            renderInput={(params) => <TextField {...params} label={t('riskMap.form.fields.controlLevel')} />}
          />
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button variant="outlined" onClick={onClose}>{t('risk.table.actions.cancel')}</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}>
              {relationId ? t('data.table.actions.update') : t('riskMap.form.actions.addMeasure')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
