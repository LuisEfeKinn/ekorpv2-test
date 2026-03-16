'use client';

import { useMemo, useState, useEffect } from 'react';

import { Box, Stack, Drawer, Button, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetRiskTablePaginationService } from 'src/services/architecture/risk/riskTable.service';
import { SaveProcessRiskService, UpdateProcessRiskService, DeleteProcessRiskService } from 'src/services/architecture/process/processRelations.service';
import { 
  GetRiskImpactLevelsService, 
  GetRiskDeficiencyLevelsService, 
  GetRiskProbabilityLevelsService 
} from 'src/services/architecture/risk/riskScales.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processId: number | string | null;
  existingItemIds?: number[];
  relationId?: number | null;
  initialData?: any;
  allowDelete?: boolean;
};

export function ProcessRiskLinkModal({ open, onClose, onSuccess, processId, existingItemIds, relationId, initialData, allowDelete }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [risks, setRisks] = useState<any[]>([]);
  
  const [riskImpactLevels, setRiskImpactLevels] = useState<any[]>([]);
  const [riskProbabilityLevels, setRiskProbabilityLevels] = useState<any[]>([]);
  const [riskDeficiencyLevels, setRiskDeficiencyLevels] = useState<any[]>([]);

  const [form, setForm] = useState({
    riskId: null as null | number,
    riskImpactLevelId: null as null | number,
    riskProbabilityLevelId: null as null | number,
    riskDeficiencyLevelId: null as null | number,
    riskCondition: '',
    severityLevel: '0',
    frequency: '0',
    impact: '0',
    probability: '0',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const currentSelectedId = initialData?.risk?.id ?? initialData?.riskId ?? null;
        const excludedIds = new Set<number>(Array.isArray(existingItemIds) ? existingItemIds : []);
        if (currentSelectedId != null) excludedIds.delete(Number(currentSelectedId));

        const [risksRes, impactRes, probRes, defRes] = await Promise.all([
          GetRiskTablePaginationService({ perPage: 1000 }),
          GetRiskImpactLevelsService(),
          GetRiskProbabilityLevelsService(),
          GetRiskDeficiencyLevelsService()
        ]);

        // Process Risks
        const rawRisks = risksRes?.data;
        let risksList: any[] = [];

        if (Array.isArray(rawRisks)) {
          // Handle [data, count] format
          if (rawRisks.length >= 1 && Array.isArray(rawRisks[0])) {
            risksList = rawRisks[0];
          } else {
            risksList = rawRisks;
          }
        } else if (Array.isArray(rawRisks?.data)) {
          risksList = rawRisks.data;
        } else if (Array.isArray(rawRisks?.data?.data)) {
          risksList = rawRisks.data.data;
        }
        
        const normalized = Array.isArray(risksList) ? risksList : [];
        const filtered = excludedIds.size
          ? normalized.filter((it: any) => !excludedIds.has(Number(it?.id)))
          : normalized;
        setRisks(filtered);

        // Process Levels
        const processLevelList = (res: any) => {
           const raw = res?.data;
           if (Array.isArray(raw)) {
             if (raw.length > 0 && Array.isArray(raw[0])) return raw[0];
             return raw;
           }
           if (Array.isArray(raw?.data)) return raw.data;
           if (Array.isArray(raw?.data?.data)) return raw.data.data;
           return [];
        };

        setRiskImpactLevels(processLevelList(impactRes));
        setRiskProbabilityLevels(processLevelList(probRes));
        setRiskDeficiencyLevels(processLevelList(defRes));

      } catch (e) {
        console.error('Error loading data:', e);
        toast.error('Error al cargar datos');
      }
    };
    if (open) {
      setSubmitted(false);
      setForm({
        riskId: initialData?.risk?.id ?? initialData?.riskId ?? null,
        riskImpactLevelId: initialData?.riskImpactLevel?.id ?? initialData?.riskImpactLevelId ?? null,
        riskProbabilityLevelId: initialData?.riskProbabilityLevel?.id ?? initialData?.riskProbabilityLevelId ?? null,
        riskDeficiencyLevelId: initialData?.riskDeficiencyLevel?.id ?? initialData?.riskDeficiencyLevelId ?? null,
        riskCondition: initialData?.riskCondition ?? '',
        severityLevel: String(initialData?.severityLevel ?? '0'),
        frequency: String(initialData?.frequency ?? '0'),
        impact: String(initialData?.impact ?? initialData?.severityLevel ?? '0'),
        probability: String(initialData?.probability ?? initialData?.frequency ?? '0'),
      });
      load();
    }
  }, [open, initialData, existingItemIds]);

  const riskOptions = useMemo(() => risks.map((r: any) => ({ label: r?.name || r?.riskName || `#${r?.id}`, id: r?.id })), [risks]);
  
  const impactLevelOptions = useMemo(() => riskImpactLevels.map((s: any) => ({ 
    id: Number(s.id), 
    label: String(s?.impactName ?? s?.impactValue ?? `#${s.id}`), 
    value: Number(s?.impactValue ?? 0) 
  })), [riskImpactLevels]);

  const probabilityLevelOptions = useMemo(() => riskProbabilityLevels.map((s: any) => ({ 
    id: Number(s.id), 
    label: String(s?.probabilityName ?? s?.probabilityValue ?? `#${s.id}`), 
    value: Number(s?.probabilityValue ?? 0) 
  })), [riskProbabilityLevels]);

  const deficiencyLevelOptions = useMemo(() => riskDeficiencyLevels.map((d: any) => ({ 
    id: Number(d.id), 
    label: String(d.deficiencyName || `#${d.id}`) 
  })), [riskDeficiencyLevels]);

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!processId || !form.riskId) {
      toast.error(t('process.map.modals.common.missingData'));
      return;
    }

    if (!form.riskImpactLevelId || !form.riskProbabilityLevelId || !form.riskDeficiencyLevelId) {
      toast.error(t('process.map.modals.common.selectScalesAndDeficiency'));
      return;
    }

    if (!form.riskCondition.trim()) {
      toast.error(t('process.map.modals.common.missingData'));
      return;
    }
    
    // Derived values
    const impactOpt = impactLevelOptions.find((o) => o.id === form.riskImpactLevelId);
    const probOpt = probabilityLevelOptions.find((o) => o.id === form.riskProbabilityLevelId);
    
    const payload = {
      process: { id: Number(processId) },
      risk: { id: Number(form.riskId) },
      
      severityLevel: Number(impactOpt?.value ?? form.severityLevel),
      frequency: Number(probOpt?.value ?? form.frequency),
      riskCondition: form.riskCondition || '',
      
      riskDeficiencyLevel: form.riskDeficiencyLevelId ? { id: Number(form.riskDeficiencyLevelId) } : undefined,
      riskImpactLevel: form.riskImpactLevelId ? { id: Number(form.riskImpactLevelId) } : undefined,
      riskProbabilityLevel: form.riskProbabilityLevelId ? { id: Number(form.riskProbabilityLevelId) } : undefined,
    };

    try {
      setLoading(true);
      if (relationId) {
        await UpdateProcessRiskService(relationId, payload);
      } else {
        await SaveProcessRiskService(payload);
      }
      toast.success(t('process.map.modals.common.save'));
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(t('process.map.modals.common.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('process.map.modals.risk.title')}
        </Typography>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={riskOptions}
            value={riskOptions.find((o) => o.id === form.riskId) || null}
            onChange={(_: any, v: any) => setForm((f) => ({ ...f, riskId: v?.id || null }))}
            renderInput={(params: any) => (
              <TextField
                {...params}
                label={t('process.map.modals.risk.fieldLabel')}
                error={submitted && !form.riskId}
                helperText={submitted && !form.riskId ? t('process.map.modals.common.missingData') : ''}
              />
            )}
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
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('riskMap.form.fields.impact')}
                error={submitted && !form.riskImpactLevelId}
                helperText={submitted && !form.riskImpactLevelId ? t('process.map.modals.common.missingData') : ''}
              />
            )}
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
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('riskMap.form.fields.probability')}
                error={submitted && !form.riskProbabilityLevelId}
                helperText={submitted && !form.riskProbabilityLevelId ? t('process.map.modals.common.missingData') : ''}
              />
            )}
          />

          <Autocomplete 
            options={deficiencyLevelOptions} 
            value={deficiencyLevelOptions.find((o) => o.id === form.riskDeficiencyLevelId) || null} 
            onChange={(_, v) => setForm((f) => ({ ...f, riskDeficiencyLevelId: v?.id ?? null }))} 
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('riskMap.form.fields.deficiency')}
                error={submitted && !form.riskDeficiencyLevelId}
                helperText={submitted && !form.riskDeficiencyLevelId ? t('process.map.modals.common.missingData') : ''}
              />
            )} 
          />

          <TextField 
            label={t('riskMap.form.fields.riskCondition')} 
            value={form.riskCondition} 
            onChange={(e) => setForm((f) => ({ ...f, riskCondition: e.target.value }))} 
            error={submitted && !form.riskCondition.trim()}
            helperText={submitted && !form.riskCondition.trim() ? t('process.map.modals.common.missingData') : ''}
          />

          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button variant="outlined" onClick={onClose}>{t('process.map.modals.common.cancel')}</Button>
            {allowDelete && relationId && (
              <Button
                variant="outlined"
                color="error"
                onClick={async () => {
                  try {
                    setLoading(true);
                    await DeleteProcessRiskService(relationId);
                    toast.success(t('process.map.modals.common.delete'));
                    onSuccess();
                    onClose();
                  } catch (e) {
                    console.error(e);
                    toast.error(t('process.map.modals.common.saveError'));
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {t('process.map.modals.common.delete')}
              </Button>
            )}
            <Button 
              variant="contained" 
              onClick={handleSubmit} 
              disabled={loading} 
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="mingcute:add-line" />}
            >
              {t('process.map.modals.common.link')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
