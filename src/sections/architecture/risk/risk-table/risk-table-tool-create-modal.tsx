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
import {
  GetToolsListService,
  SaveToolRiskRelationService
} from 'src/services/architecture/risk/riskTools.service';

import { toast } from 'src/components/snackbar';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  riskId: string;
  parentNodeId: string;
};

export function RiskTableToolCreateModal({ open, onClose, onSuccess, riskId }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<any[]>([]);
  const [form, setForm] = useState({ toolId: null as null | number, severityLevel: '1', frequency: '1', probability: '1', impact: '1', vulnerability: 'Media' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await GetToolsListService();
        const raw = res?.data;
        let list: any[] = [];
        if (Array.isArray(raw)) {
          list = Array.isArray(raw[0]) ? raw[0] : raw.filter((it) => typeof it === 'object' && it);
        } else if (Array.isArray((res as any)?.data?.data)) {
          list = (res as any).data.data;
        }
        setTools(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        toast.error(t('tools.table.messages.error.loading'));
      }
    };
    if (open) load();
  }, [open, t]);

  const toolOptions = useMemo(() => (Array.isArray(tools) ? tools : []).filter((p: any) => typeof p === 'object' && p && (p?.id != null)).map((p: any) => ({ label: String(p?.name || p?.label || `#${p?.id}`), id: Number(p?.id) })), [tools]);
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
          <TextField type="text" inputProps={{ inputMode: 'decimal', pattern: '^[0-9]*([.,][0-9]*)?$' }} label={t('riskMap.form.fields.severity')} value={form.severityLevel} onChange={(e) => setForm((f) => ({ ...f, severityLevel: sanitizeDecimal(e.target.value) }))} />
          <TextField type="text" inputProps={{ inputMode: 'decimal', pattern: '^[0-9]*([.,][0-9]*)?$' }} label={t('riskMap.form.fields.frequency')} value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: sanitizeDecimal(e.target.value) }))} />
          <TextField type="text" inputProps={{ inputMode: 'decimal', pattern: '^[0-9]*([.,][0-9]*)?$' }} label={t('riskMap.form.fields.probability')} value={form.probability} onChange={(e) => setForm((f) => ({ ...f, probability: sanitizeDecimal(e.target.value) }))} />
          <TextField type="text" inputProps={{ inputMode: 'decimal', pattern: '^[0-9]*([.,][0-9]*)?$' }} label={t('riskMap.form.fields.impact')} value={form.impact} onChange={(e) => setForm((f) => ({ ...f, impact: sanitizeDecimal(e.target.value) }))} />
          <TextField label={t('riskMap.form.fields.vulnerability')} value={form.vulnerability} onChange={(e) => setForm((f) => ({ ...f, vulnerability: e.target.value }))} />
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
