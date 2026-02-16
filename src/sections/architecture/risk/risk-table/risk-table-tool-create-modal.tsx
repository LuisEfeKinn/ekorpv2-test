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
  GetToolsListService,
  SaveToolRiskRelationService
} from 'src/services/architecture/risk/riskTools.service';
import {
  GetRiskImpactLevelsService,
  GetRiskDeficiencyLevelsService,
  GetRiskProbabilityLevelsService,
} from 'src/services/architecture/risk/riskScales.service';

import { toast } from 'src/components/snackbar';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  riskId: string;
  parentNodeId: string;
};

type FormState = {
  toolId: number | null;
  severityLevel: string;
  frequency: string;
  probability: string;
  impact: string;
  riskImpactLevelId: number | null;
  riskProbabilityLevelId: number | null;
  riskDeficiencyLevelId: number | null;
  riskCondition: string;
};

export function RiskTableToolCreateModal({ open, onClose, onSuccess, riskId }: Props) {
  const { t, currentLang } = useTranslate('architecture');
  const tf = useCallback((key: string, en: string, es?: string) => {
    const v = t(key);
    return v && v !== key ? v : (currentLang?.value === 'es' ? (es ?? en) : en);
  }, [t, currentLang]);
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<any[]>([]);
  const [riskImpactLevels, setRiskImpactLevels] = useState<any[]>([]);
  const [riskProbabilityLevels, setRiskProbabilityLevels] = useState<any[]>([]);
  const [riskDeficiencyLevels, setRiskDeficiencyLevels] = useState<any[]>([]);
  const [form, setForm] = useState<FormState>({
    toolId: null,
    severityLevel: '1',
    frequency: '1',
    probability: '1',
    impact: '1',
    riskImpactLevelId: null,
    riskProbabilityLevelId: null,
    riskDeficiencyLevelId: null,
    riskCondition: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const riskRes = await GetRiskTableByIdService(riskId);
        const riskRaw = riskRes?.data;
        const riskData: any = Array.isArray(riskRaw?.data) ? (riskRaw?.data?.[0] ?? {}) : (riskRaw?.data ?? riskRaw);
        const riskTypeId = Number((riskData?.riskType?.id ?? riskData?.riskTypeId ?? riskData?.type?.id) as any) || undefined;

        const [toolsRes, impactRes, probRes, defRes] = await Promise.all([
          GetToolsListService(),
          GetRiskImpactLevelsService(riskTypeId ? { risktype: riskTypeId } : undefined),
          GetRiskProbabilityLevelsService(riskTypeId ? { risktype: riskTypeId } : undefined),
          GetRiskDeficiencyLevelsService(riskTypeId ? { risktype: riskTypeId } : undefined),
        ]);

        const toolsRaw = toolsRes?.data;
        let toolsList: any[] = [];
        if (Array.isArray(toolsRaw)) {
          toolsList = Array.isArray(toolsRaw[0]) ? toolsRaw[0] : toolsRaw.filter((it) => typeof it === 'object' && it);
        } else if (Array.isArray((toolsRes as any)?.data?.data)) {
          toolsList = (toolsRes as any).data.data;
        }
        setTools(Array.isArray(toolsList) ? toolsList : []);

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
        const defRaw = defRes?.data;
        const defList: any[] = Array.isArray(defRaw)
          ? (Array.isArray(defRaw[0]) ? defRaw[0] : defRaw.filter((it: any) => typeof it === 'object' && it))
          : Array.isArray((defRes as any)?.data?.data)
            ? (defRes as any).data.data
            : [];
        setRiskImpactLevels(Array.isArray(impactList) ? impactList : []);
        setRiskProbabilityLevels(Array.isArray(probList) ? probList : []);
        setRiskDeficiencyLevels(Array.isArray(defList) ? defList : []);
      } catch (e) {
        console.error(e);
        toast.error(tf('tools.table.messages.error.loading', 'Error loading data', 'Error al cargar datos'));
      }
    };
    if (open) load();
  }, [open, tf, riskId]);

  const toolOptions = useMemo(() => (Array.isArray(tools) ? tools : [])
    .filter((p: any) => typeof p === 'object' && p && (p?.id != null))
    .map((p: any) => ({ label: String(p?.name || p?.label || `#${p?.id}`), id: Number(p?.id) })), [tools]);

  const impactLevelOptions = useMemo(() => {
    const list = (Array.isArray(riskImpactLevels) ? riskImpactLevels : []).filter((s: any) => s && s.id != null);
    return list.map((s: any) => ({ id: Number(s.id), label: String(s?.impactName ?? s?.impactValue ?? `#${s.id}`), value: Number(s?.impactValue ?? 0) }));
  }, [riskImpactLevels]);
  const probabilityLevelOptions = useMemo(() => {
    const list = (Array.isArray(riskProbabilityLevels) ? riskProbabilityLevels : []).filter((s: any) => s && s.id != null);
    return list.map((s: any) => ({ id: Number(s.id), label: String(s?.probabilityName ?? s?.probabilityValue ?? `#${s.id}`), value: Number(s?.probabilityValue ?? 0) }));
  }, [riskProbabilityLevels]);
  const deficiencyLevelOptions = useMemo(() => (Array.isArray(riskDeficiencyLevels) ? riskDeficiencyLevels : [])
    .filter((d: any) => d && d.id != null)
    .map((d: any) => ({ id: Number(d.id), label: String(d.deficiencyName || `#${d.id}`) })), [riskDeficiencyLevels]);

  const handleSubmit = async () => {
    if (!form.toolId) {
      toast.error(tf('tools.table.messages.error.loading', 'Error loading data', 'Error al cargar datos'));
      return;
    }
    if (!form.riskImpactLevelId || !form.riskProbabilityLevelId || !form.riskDeficiencyLevelId) {
      toast.error(tf('risk.table.messages.error.missingScales', 'Select scales and deficiency level', 'Selecciona escalas y nivel de deficiencia'));
      return;
    }

    const payload = {
      description: form.riskCondition || '',
      riskProbabilityLevel: { id: Number(form.riskProbabilityLevelId) },
      riskImpactLevel: { id: Number(form.riskImpactLevelId) },
      risk: { id: Number(riskId) },
      tool: { id: Number(form.toolId) },
      riskDeficiencyLevel: { id: Number(form.riskDeficiencyLevelId) },
    };
    try {
      setLoading(true);
      await SaveToolRiskRelationService(payload);
      toast.success(t('tools.table.messages.success.created'));
      onSuccess();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Error';
      const status = e?.response?.status;
      console.error('Error saving tool risk:', { status, message: msg, data: e?.response?.data });
      toast.error(t('tools.table.messages.error.saving'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{t('riskMap.form.actions.addTools')}</Typography>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={toolOptions}
            value={toolOptions.find((o) => o.id === form.toolId) || null}
            onChange={(_, v) => setForm((f) => ({ ...f, toolId: v?.id || null }))}
            getOptionLabel={(o) => o?.label ?? ''}
            isOptionEqualToValue={(o, v) => o?.id === v?.id}
            disablePortal
            renderInput={(params) => <TextField {...params} label={t('tools.table.title')} />}
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
          <Autocomplete
            options={deficiencyLevelOptions}
            value={deficiencyLevelOptions.find((o) => o.id === form.riskDeficiencyLevelId) || null}
            onChange={(_, v) => setForm((f) => ({ ...f, riskDeficiencyLevelId: v?.id ?? null }))}
            renderInput={(params) => <TextField {...params} label={t('riskMap.form.fields.deficiency')} />}
          />
          <TextField label={t('riskMap.form.fields.riskCondition')} value={form.riskCondition} onChange={(e) => setForm((f) => ({ ...f, riskCondition: e.target.value }))} />
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button variant="outlined" onClick={onClose}>{t('risk.table.actions.cancel')}</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}>
              {t('tools.table.actions.add')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
