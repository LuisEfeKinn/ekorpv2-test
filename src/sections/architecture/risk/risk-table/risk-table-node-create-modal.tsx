'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

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
import { GetRiskTableByIdService } from 'src/services/architecture/risk/riskTable.service';
import {
  GetProcessesListService,
  SaveProcessRiskRelationService,
  UpdateProcessRiskRelationService
} from 'src/services/architecture/risk/riskJobs.service';
import {
  GetRiskImpactLevelsService,
  GetRiskDeficiencyLevelsService,
  GetRiskProbabilityLevelsService
} from 'src/services/architecture/risk/riskScales.service';

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

export function RiskTableNodeCreateModal({ open, onClose, onSuccess, riskId, parentNodeId, relationId, initialData }: Props) {
  const { t, currentLang } = useTranslate('architecture');
  const tf = useCallback((key: string, en: string, es?: string) => {
    const v = t(key);
    return v && v !== key ? v : (currentLang?.value === 'es' ? (es ?? en) : en);
  }, [t, currentLang]);
  const [loading, setLoading] = useState(false);
  const [processes, setProcesses] = useState<any[]>([]);
  const [riskImpactLevels, setRiskImpactLevels] = useState<any[]>([]);
  const [riskProbabilityLevels, setRiskProbabilityLevels] = useState<any[]>([]);
  const [riskDeficiencyLevels, setRiskDeficiencyLevels] = useState<any[]>([]);
  const [form, setForm] = useState({ processId: null as null | number, severityLevel: '1', frequency: '1', probability: '1', impact: '1', riskImpactLevelId: null as null | number, riskProbabilityLevelId: null as null | number, riskDeficiencyLevelId: null as null | number, riskCondition: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const riskRes = await GetRiskTableByIdService(riskId);
        const riskRaw = riskRes?.data;
        const riskData: any = Array.isArray(riskRaw?.data) ? (riskRaw?.data?.[0] ?? {}) : (riskRaw?.data ?? riskRaw);
        const riskTypeId = Number((riskData?.riskType?.id ?? riskData?.riskTypeId ?? riskData?.type?.id) as any) || undefined;

        const [procRes, impactRes, probRes, defLevelsRes] = await Promise.all([
          GetProcessesListService(),
          GetRiskImpactLevelsService(riskTypeId ? { risktype: riskTypeId } : undefined),
          GetRiskProbabilityLevelsService(riskTypeId ? { risktype: riskTypeId } : undefined),
          GetRiskDeficiencyLevelsService(riskTypeId ? { risktype: riskTypeId } : undefined),
        ]);
        const list = Array.isArray(procRes?.data) ? procRes.data : Array.isArray(procRes?.data?.data) ? procRes.data.data : [];
        setProcesses(list);
        const impactRaw = impactRes?.data;
        const impactList: any[] = Array.isArray(impactRaw)
          ? (Array.isArray(impactRaw[0]) ? impactRaw[0] : impactRaw.filter((it: any) => typeof it === 'object' && it))
          : Array.isArray((impactRes as any)?.data?.data)
            ? (impactRes as any).data.data
            : [];
        const probRaw = probRes?.data;
        const probList: any[] = Array.isArray(probRaw)
          ? (Array.isArray(probRaw[0]) ? probRaw[0] : probRaw.filter((it: any) => typeof it === 'object' && it))
          : Array.isArray((probRes as any)?.data?.data)
            ? (probRes as any).data.data
            : [];
        const defRaw = defLevelsRes?.data;
        const defList: any[] = Array.isArray(defRaw)
          ? (Array.isArray(defRaw[0]) ? defRaw[0] : defRaw.filter((it: any) => typeof it === 'object' && it))
          : Array.isArray((defLevelsRes as any)?.data?.data)
            ? (defLevelsRes as any).data.data
            : [];
        setRiskImpactLevels(Array.isArray(impactList) ? impactList : []);
        setRiskProbabilityLevels(Array.isArray(probList) ? probList : []);
        setRiskDeficiencyLevels(Array.isArray(defList) ? defList : []);
      } catch (e) {
        console.error(e);
        toast.error(tf('process.table.messages.error.loading', 'Error loading data', 'Error al cargar datos'));
      }
    };
    if (open) load();
  }, [open, t, tf, riskId]);

  useEffect(() => {
    if (open && initialData) {
      const procId = Number(((initialData?.process?.id ?? initialData?.processId ?? initialData?.id) as any) ?? null);
      const sev = String(initialData?.severityLevel ?? '');
      const freq = String(initialData?.frequency ?? '');
      const prob = String(initialData?.probability ?? '');
      const imp = String(initialData?.impact ?? '');
      const sevScaleId = Number((initialData?.riskImpactLevel?.id ?? initialData?.severityScale?.id ?? null) as any) || null;
      const freqScaleId = Number((initialData?.riskProbabilityLevel?.id ?? initialData?.frequencyScale?.id ?? null) as any) || null;
      const defId = Number((initialData?.riskDeficiencyLevel?.id ?? null) as any) || null;
      const cond = String(initialData?.riskCondition ?? '');
      setForm({
        processId: Number.isFinite(procId) && procId > 0 ? procId : null,
        severityLevel: sev || '1',
        frequency: freq || '1',
        probability: prob || '1',
        impact: imp || '1',
        riskImpactLevelId: sevScaleId,
        riskProbabilityLevelId: freqScaleId,
        riskDeficiencyLevelId: defId,
        riskCondition: cond,
      });
    }
  }, [open, initialData]);

  const processOptions = useMemo(() => processes.map((p: any) => ({ label: String(p?.name ?? `#${p?.id}`), id: p?.id })), [processes]);
  const impactLevelOptions = useMemo(() => {
    const list = (Array.isArray(riskImpactLevels) ? riskImpactLevels : []).filter((s: any) => s && s.id != null);
    return list.map((s: any) => ({ id: Number(s.id), label: String(s?.impactName ?? s?.impactValue ?? `#${s.id}`), value: Number(s?.impactValue ?? 0) }));
  }, [riskImpactLevels]);
  const probabilityLevelOptions = useMemo(() => {
    const list = (Array.isArray(riskProbabilityLevels) ? riskProbabilityLevels : []).filter((s: any) => s && s.id != null);
    return list.map((s: any) => ({ id: Number(s.id), label: String(s?.probabilityName ?? s?.probabilityValue ?? `#${s.id}`), value: Number(s?.probabilityValue ?? 0) }));
  }, [riskProbabilityLevels]);
  const deficiencyLevelOptions = useMemo(() => (Array.isArray(riskDeficiencyLevels) ? riskDeficiencyLevels : []).filter((d: any) => d && d.id != null).map((d: any) => ({ id: Number(d.id), label: String(d.deficiencyName || `#${d.id}`) })), [riskDeficiencyLevels]);

  const handleSubmit = async () => {
    if (!form.processId) {
      toast.error(tf('process.table.messages.error.loading', 'Error loading data', 'Error al cargar datos'));
      return;
    }
    if (!form.riskImpactLevelId || !form.riskProbabilityLevelId || !form.riskDeficiencyLevelId) {
      toast.error(tf('risk.table.messages.error.missingScales', 'Select scales and deficiency level', 'Selecciona escalas y nivel de deficiencia'));
      return;
    }
    const impactOpt = impactLevelOptions.find((o) => o.id === form.riskImpactLevelId);
    const probOpt = probabilityLevelOptions.find((o) => o.id === form.riskProbabilityLevelId);
    const sevVal = Number(impactOpt?.value ?? form.severityLevel ?? 0);
    const freqVal = Number(probOpt?.value ?? form.frequency ?? 0);
    const payload = {
      severityLevel: sevVal,
      frequency: freqVal,
      riskCondition: form.riskCondition || '',
      risk: { id: Number(riskId) },
      process: { id: Number(form.processId) },
      riskDeficiencyLevel: { id: Number(form.riskDeficiencyLevelId) },
      riskImpactLevel: { id: Number(form.riskImpactLevelId) },
      riskProbabilityLevel: { id: Number(form.riskProbabilityLevelId) },
    };
    try {
      setLoading(true);
      if (relationId) {
        await UpdateProcessRiskRelationService(relationId, payload);
        toast.success(tf('process.table.messages.success.created', 'Relation updated', 'Relación actualizada'));
      } else {
        await SaveProcessRiskRelationService(payload);
        toast.success(tf('process.table.messages.success.created', 'Relation created', 'Relación creada'));
      }
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(tf('risk.table.messages.error.saving', 'Error saving relation', 'Error al guardar la relación'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{relationId ? t('risk.table.actions.edit') : t('riskMap.form.actions.addProcess')}</Typography>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={processOptions}
            value={processOptions.find((o) => o.id === form.processId) || null}
            onChange={(_, v) => setForm((f) => ({ ...f, processId: v?.id || null }))}
            renderInput={(params) => <TextField {...params} label={t('riskMap.form.fields.process')} />}
          />
          <Autocomplete
            options={impactLevelOptions}
            value={impactLevelOptions.find((o) => o.id === form.riskImpactLevelId) || null}
            onChange={(_, v: any) => setForm((f) => ({
              ...f,
              riskImpactLevelId: v?.id ?? null,
              impact: v?.value != null ? String(v.value) : f.impact,
              severityLevel: v?.value != null ? String(v.value) : f.severityLevel,
            }))}
            renderInput={(params) => <TextField {...params} label={t('riskMap.form.fields.impact')} />}
          />
          <Autocomplete
            options={probabilityLevelOptions}
            value={probabilityLevelOptions.find((o) => o.id === form.riskProbabilityLevelId) || null}
            onChange={(_, v: any) => setForm((f) => ({
              ...f,
              riskProbabilityLevelId: v?.id ?? null,
              probability: v?.value != null ? String(v.value) : f.probability,
              frequency: v?.value != null ? String(v.value) : f.frequency,
            }))}
            renderInput={(params) => <TextField {...params} label={t('riskMap.form.fields.probability')} />}
          />
          <Autocomplete options={deficiencyLevelOptions} value={deficiencyLevelOptions.find((o) => o.id === form.riskDeficiencyLevelId) || null} onChange={(_, v) => setForm((f) => ({ ...f, riskDeficiencyLevelId: v?.id ?? null }))} renderInput={(params) => <TextField {...params} label={t('riskMap.form.fields.deficiency')} />} />

          <TextField label={t('riskMap.form.fields.riskCondition')} value={form.riskCondition} onChange={(e) => setForm((f) => ({ ...f, riskCondition: e.target.value }))} />
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button variant="outlined" onClick={onClose}>{t('risk.table.actions.cancel')}</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}>
              {relationId ? t('risk.table.actions.save') : t('process.table.actions.add')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
