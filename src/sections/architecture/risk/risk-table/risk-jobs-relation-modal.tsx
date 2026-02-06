'use client';

import { useMemo, useState, useEffect } from 'react';

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
  GetRiskProbabilityLevelsService
} from 'src/services/architecture/risk/riskScales.service';
import {
  GetJobsListService,
  GetProcessesListService,
  SaveRiskJobRelationService,
  SaveProcessRiskRelationService
} from 'src/services/architecture/risk/riskJobs.service';
import {
  GetControlLevelEnumService,
  GetActionMeasuresListService,
  GetMandatoryRecommendedEnumService,
  SaveRiskActionMeasureRelationService
} from 'src/services/architecture/risk/riskActionMeasures.service';

import { toast } from 'src/components/snackbar';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  riskId: number;
};

export function RiskJobsRelationModal({ open, onClose, onSuccess, riskId }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [mandatoryList, setMandatoryList] = useState<any[]>([]);
  const [controlLevelList, setControlLevelList] = useState<any[]>([]);
  const [measureList, setMeasureList] = useState<any[]>([]);
  const [riskImpactLevels, setRiskImpactLevels] = useState<any[]>([]);
  const [riskProbabilityLevels, setRiskProbabilityLevels] = useState<any[]>([]);
  const [riskDeficiencyLevels, setRiskDeficiencyLevels] = useState<any[]>([]);
  const [form, setForm] = useState({
    description: '',
    jobId: null as null | number,
    processId: null as null | number,
    toolId: null as null | number,
    actionMeasureId: null as null | number,
    mandatoryRecommended: null as null | number,
    controlLevel: null as null | number,
    probability: '1',
    impact: '1',
    severityLevel: '1',
    frequency: '1',
    vulnerability: 'Media',
    riskImpactLevelId: null as null | number,
    riskProbabilityLevelId: null as null | number,
    riskDeficiencyLevelId: null as null | number,
    riskCondition: '',
  });
  const [mode, setMode] = useState<'jobs' | 'process' | 'tool' | 'measure'>('jobs');

  useEffect(() => {
    const load = async () => {
      try {
        const riskRes = await GetRiskTableByIdService(riskId);
        const riskRaw = riskRes?.data;
        const riskData: any = Array.isArray(riskRaw?.data) ? (riskRaw?.data?.[0] ?? {}) : (riskRaw?.data ?? riskRaw);
        const riskTypeId = Number((riskData?.riskType?.id ?? riskData?.riskTypeId ?? riskData?.type?.id) as any) || undefined;

        const [jobsRes, procRes, toolsRes, mrRes, clRes, amRes, impactRes, probRes, defLevelsRes] = await Promise.all([
          GetJobsListService(),
          GetProcessesListService(),
          GetToolsListService(),
          GetMandatoryRecommendedEnumService(),
          GetControlLevelEnumService(),
          GetActionMeasuresListService(),
          GetRiskImpactLevelsService(riskTypeId ? { risktype: riskTypeId } : undefined),
          GetRiskProbabilityLevelsService(riskTypeId ? { risktype: riskTypeId } : undefined),
          GetRiskDeficiencyLevelsService(riskTypeId ? { risktype: riskTypeId } : undefined),
        ]);
        const jobsList = Array.isArray(jobsRes?.data) ? jobsRes.data : Array.isArray(jobsRes?.data?.data) ? jobsRes.data.data : [];
        const procList = Array.isArray(procRes?.data) ? procRes.data : Array.isArray(procRes?.data?.data) ? procRes.data.data : [];
        const toolsRaw = toolsRes?.data;
        const toolsList: any[] = Array.isArray(toolsRaw)
          ? (Array.isArray(toolsRaw[0]) ? toolsRaw[0] : toolsRaw.filter((it) => typeof it === 'object' && it))
          : Array.isArray((toolsRes as any)?.data?.data)
            ? (toolsRes as any).data.data
            : [];
        const mrData = Array.isArray(mrRes?.data) ? mrRes.data : mrRes?.data?.data ?? [];
        const clData = Array.isArray(clRes?.data) ? clRes.data : clRes?.data?.data ?? [];
        const amRaw = amRes?.data;
        const amList: any[] = Array.isArray(amRaw)
          ? amRaw.filter((it) => typeof it === 'object' && it)
          : Array.isArray((amRes as any)?.data?.data)
            ? (amRes as any).data.data
            : [];

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

        setJobs(jobsList);
        setProcesses(procList);
        setTools(Array.isArray(toolsList) ? toolsList : []);
        setMandatoryList(mrData);
        setControlLevelList(clData);
        setMeasureList(Array.isArray(amList) ? amList : []);
        setRiskImpactLevels(Array.isArray(impactList) ? impactList : []);
        setRiskProbabilityLevels(Array.isArray(probList) ? probList : []);
        setRiskDeficiencyLevels(Array.isArray(defList) ? defList : []);
      } catch (e) {
        console.error(e);
        toast.error(t('risk.table.messages.error.loading'));
      }
    };
    if (open) load();
  }, [open, t, riskId]);

  const jobOptions = useMemo(() => jobs.map((j: any) => ({ label: j?.name || j?.label || `#${j?.id}`, id: j?.id })), [jobs]);
  const processOptions = useMemo(() => processes.map((p: any) => ({ label: String(p?.name ?? `#${p?.id}`), id: p?.id })), [processes]);
  const toolOptions = useMemo(() => (Array.isArray(tools) ? tools : []).filter((p: any) => typeof p === 'object' && p && (p?.id != null)).map((p: any) => ({ label: String(p?.name || p?.label || `#${p?.id}`), id: Number(p?.id) })), [tools]);
  const mandatoryOptions = useMemo(() => (Array.isArray(mandatoryList) ? mandatoryList : []).map((p: any) => ({ label: p?.label ?? String(p?.value), id: Number(p?.value) })), [mandatoryList]);
  const controlLevelOptions = useMemo(() => (Array.isArray(controlLevelList) ? controlLevelList : []).map((p: any) => ({ label: p?.label ?? String(p?.value), id: Number(p?.value) })), [controlLevelList]);
  const measureOptions = useMemo(() => (Array.isArray(measureList) ? measureList : []).filter((m: any) => m && m.id != null).map((m: any) => ({ id: Number(m.id), label: String(m.name || m.code || `#${m.id}`) })), [measureList]);
  const impactLevelOptions = useMemo(() => (Array.isArray(riskImpactLevels) ? riskImpactLevels : []).filter((s: any) => s && s.id != null).map((s: any) => ({ id: Number(s.id), label: String(s?.impactName ?? s?.impactValue ?? `#${s.id}`), value: Number(s?.impactValue ?? 0) })), [riskImpactLevels]);
  const probabilityLevelOptions = useMemo(() => (Array.isArray(riskProbabilityLevels) ? riskProbabilityLevels : []).filter((s: any) => s && s.id != null).map((s: any) => ({ id: Number(s.id), label: String(s?.probabilityName ?? s?.probabilityValue ?? `#${s.id}`), value: Number(s?.probabilityValue ?? 0) })), [riskProbabilityLevels]);
  const deficiencyLevelOptions = useMemo(() => (Array.isArray(riskDeficiencyLevels) ? riskDeficiencyLevels : []).filter((d: any) => d && d.id != null).map((d: any) => ({ id: Number(d.id), label: String(d.deficiencyName || `#${d.id}`) })), [riskDeficiencyLevels]);
  const sanitizeDecimal = (val: string) => {
    let s = (val || '').replace(/,/g, '.');
    s = s.replace(/[^0-9.]/g, '');
    const firstDot = s.indexOf('.');
    if (firstDot >= 0) s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
    if (s.startsWith('.')) s = `0${s}`;
    s = s.replace(/^0+(?!\.)/, '');
    return s;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (mode === 'jobs') {
        if (!form.jobId) {
          toast.error('Selecciona un Job');
          return;
        }
        const payload = {
          description: form.description || 'Relación riesgo-cargo',
          riskId: Number(riskId),
          jobId: Number(form.jobId),
          probability: parseFloat((form.probability || '0').toString().replace(',', '.')),
          impact: parseFloat((form.impact || '0').toString().replace(',', '.')),
        };
        await SaveRiskJobRelationService(payload);
        toast.success(t('risk.table.messages.success.created'));
      } else if (mode === 'process') {
        if (!form.processId) {
          toast.error(t('process.table.messages.error.loading'));
          return;
        }
        if (!form.riskImpactLevelId || !form.riskProbabilityLevelId || !form.riskDeficiencyLevelId) {
          toast.error('Selecciona escalas y nivel de deficiencia');
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
          description: form.description || 'Relación riesgo-proceso'
        };
        await SaveProcessRiskRelationService(payload);
        toast.success(t('process.table.messages.success.created'));
      } else if (mode === 'tool') {
        if (!form.toolId) {
          toast.error(t('tools.table.messages.error.loading'));
          return;
        }
        const payload = {
          riskId: Number(riskId),
          toolId: Number(form.toolId),
          severityLevel: parseFloat((form.severityLevel || '0').toString().replace(',', '.')),
          frequency: parseFloat((form.frequency || '0').toString().replace(',', '.')),
          probability: parseFloat((form.probability || '0').toString().replace(',', '.')),
          impact: parseFloat((form.impact || '0').toString().replace(',', '.')),
          vulnerability: form.vulnerability,
          description: form.description || 'Relación riesgo-herramienta'
        };
        await SaveToolRiskRelationService(payload);
        toast.success(t('tools.table.messages.success.created'));
      } else if (mode === 'measure') {
        if (!form.actionMeasureId || form.mandatoryRecommended == null || form.controlLevel == null) {
          toast.error(t('data.table.actions.save'));
          return;
        }
        const payload = {
          mandatoryRecommended: Number(form.mandatoryRecommended),
          controlLevel: Number(form.controlLevel),
          riskId: Number(riskId),
          actionMeasureId: Number(form.actionMeasureId),
          description: form.description || 'Relación riesgo-medida'
        };
        await SaveRiskActionMeasureRelationService(payload);
        toast.success(t('data.table.actions.save'));
      }
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(t('risk.table.messages.error.saving'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{t('riskMap.panel.actionsTitle')}</Typography>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction="row" spacing={1}>
            <Button variant={mode === 'jobs' ? 'contained' : 'outlined'} onClick={() => setMode('jobs')}>Jobs</Button>
            <Button variant={mode === 'process' ? 'contained' : 'outlined'} onClick={() => setMode('process')}>Procesos</Button>
            <Button variant={mode === 'tool' ? 'contained' : 'outlined'} onClick={() => setMode('tool')}>Herramientas</Button>
            <Button variant={mode === 'measure' ? 'contained' : 'outlined'} onClick={() => setMode('measure')}>Medidas</Button>
          </Stack>

          {mode === 'jobs' ? (
            <>
              <Autocomplete options={jobOptions} value={jobOptions.find((o) => o.id === form.jobId) || null} onChange={(_, v) => setForm((f) => ({ ...f, jobId: v?.id || null }))} renderInput={(params) => <TextField {...params} label="Job" />} />
              <TextField label="Descripción" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <TextField label="Probabilidad" value={form.probability} onChange={(e) => setForm((f) => ({ ...f, probability: e.target.value }))} />
              <TextField label="Impacto" value={form.impact} onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value }))} />
            </>
          ) : mode === 'process' ? (
            <>
              <Autocomplete options={processOptions} value={processOptions.find((o) => o.id === form.processId) || null} onChange={(_, v) => setForm((f) => ({ ...f, processId: v?.id || null }))} renderInput={(params) => <TextField {...params} label="Proceso" />} />
              <Autocomplete
                options={impactLevelOptions}
                value={impactLevelOptions.find((o) => o.id === form.riskImpactLevelId) || null}
                onChange={(_, v: any) => setForm((f) => ({
                  ...f,
                  riskImpactLevelId: v?.id ?? null,
                  impact: v?.value != null ? String(v.value) : f.impact,
                  severityLevel: v?.value != null ? String(v.value) : f.severityLevel,
                }))}
                renderInput={(params) => <TextField {...params} label="Impacto" />}
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
                renderInput={(params) => <TextField {...params} label="Probabilidad" />}
              />
              <Autocomplete options={deficiencyLevelOptions} value={deficiencyLevelOptions.find((o) => o.id === form.riskDeficiencyLevelId) || null} onChange={(_, v) => setForm((f) => ({ ...f, riskDeficiencyLevelId: v?.id ?? null }))} renderInput={(params) => <TextField {...params} label="Nivel de Deficiencia" />} />

              <TextField label="Condición del riesgo" value={form.riskCondition} onChange={(e) => setForm((f) => ({ ...f, riskCondition: e.target.value }))} />
              <TextField label="Descripción" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </>
          ) : mode === 'tool' ? (
            <>
              <Autocomplete options={toolOptions} value={toolOptions.find((o) => o.id === form.toolId) || null} onChange={(_, v) => setForm((f) => ({ ...f, toolId: v?.id || null }))} renderInput={(params) => <TextField {...params} label="Herramienta" />} />
              <TextField type="text" inputProps={{ inputMode: 'decimal', pattern: '^[0-9]*([.,][0-9]*)?$' }} label="Severidad" value={form.severityLevel} onChange={(e) => setForm((f) => ({ ...f, severityLevel: sanitizeDecimal(e.target.value) }))} />
              <TextField type="text" inputProps={{ inputMode: 'decimal', pattern: '^[0-9]*([.,][0-9]*)?$' }} label="Frecuencia" value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: sanitizeDecimal(e.target.value) }))} />
              <TextField type="text" inputProps={{ inputMode: 'decimal', pattern: '^[0-9]*([.,][0-9]*)?$' }} label="Probabilidad" value={form.probability} onChange={(e) => setForm((f) => ({ ...f, probability: sanitizeDecimal(e.target.value) }))} />
              <TextField type="text" inputProps={{ inputMode: 'decimal', pattern: '^[0-9]*([.,][0-9]*)?$' }} label="Impacto" value={form.impact} onChange={(e) => setForm((f) => ({ ...f, impact: sanitizeDecimal(e.target.value) }))} />
              <TextField label="Vulnerabilidad" value={form.vulnerability} onChange={(e) => setForm((f) => ({ ...f, vulnerability: e.target.value }))} />
            </>
          ) : (
            <>
              <Autocomplete options={measureOptions} value={measureOptions.find((o) => o.id === form.actionMeasureId) || null} onChange={(_, v) => setForm((f) => ({ ...f, actionMeasureId: v?.id ?? null }))} renderInput={(params) => <TextField {...params} label={t('riskMap.form.fields.measure')} />} />
              <Autocomplete options={mandatoryOptions} value={mandatoryOptions.find((o) => o.id === form.mandatoryRecommended) || null} onChange={(_, v) => setForm((f) => ({ ...f, mandatoryRecommended: v?.id ?? null }))} renderInput={(params) => <TextField {...params} label={t('riskMap.form.fields.mandatoryRecommended')} />} />
              <Autocomplete options={controlLevelOptions} value={controlLevelOptions.find((o) => o.id === form.controlLevel) || null} onChange={(_, v) => setForm((f) => ({ ...f, controlLevel: v?.id ?? null }))} renderInput={(params) => <TextField {...params} label={t('riskMap.form.fields.controlLevel')} />} />
            </>
          )}
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button variant="outlined" onClick={onClose}>{t('risk.table.actions.cancel')}</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}>
              {t('risk.table.actions.save')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
