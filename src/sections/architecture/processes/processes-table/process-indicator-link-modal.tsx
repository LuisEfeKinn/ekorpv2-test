'use client';

import type { SyntheticEvent } from 'react';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';

import { useMemo, useState, useEffect } from 'react';

import { Box, Stack, Drawer, Button, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';

import { useTranslate } from 'src/locales';
import {
  GetIndicatorsListService,
  SaveProcessIndicatorService,
  type ProcessIndicatorRelation,
  UpdateProcessIndicatorService,
  DeleteProcessIndicatorService,
  GetProcessIndicatorByIdService,
} from 'src/services/architecture/process/processRelations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processId: number | string | null;
  existingItemIds?: number[];
  relationId?: number | null;
  initialData?: Partial<ProcessIndicatorRelation> | null;
  allowDelete?: boolean;
};

type IndicatorCatalogItem = {
  id: number;
  indicatorName?: string | null;
  indicatorCode?: string | null;
  name?: string | null;
  code?: string | null;
};
type IndicatorOption = { id: number; label: string };

export function ProcessIndicatorLinkModal({ open, onClose, onSuccess, processId, existingItemIds, relationId, initialData, allowDelete }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [items, setItems] = useState<IndicatorCatalogItem[]>([]);
  const [form, setForm] = useState({
    itemId: null as null | number,
    observations: '',
  });

  useEffect(() => {
    if (!open) return undefined;

    let active = true;

    const getFiniteNumber = (value: unknown): number | null => {
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const normalizeIndicatorsList = (raw: unknown): IndicatorCatalogItem[] => {
      if (Array.isArray(raw)) {
        const maybeTuple = raw.length >= 1 && Array.isArray(raw[0]) ? raw[0] : raw;
        return (maybeTuple as unknown[]).filter((it): it is IndicatorCatalogItem => {
          if (!it || typeof it !== 'object') return false;
          return Number.isFinite(Number((it as Record<string, unknown>).id));
        }).map((it) => ({
          id: Number((it as Record<string, unknown>).id),
          indicatorName:
            typeof (it as Record<string, unknown>).indicatorName === 'string'
              ? String((it as Record<string, unknown>).indicatorName)
              : undefined,
          indicatorCode:
            typeof (it as Record<string, unknown>).indicatorCode === 'string'
              ? String((it as Record<string, unknown>).indicatorCode)
              : undefined,
          name: typeof (it as Record<string, unknown>).name === 'string' ? String((it as Record<string, unknown>).name) : undefined,
          code: typeof (it as Record<string, unknown>).code === 'string' ? String((it as Record<string, unknown>).code) : undefined,
        }));
      }

      if (raw && typeof raw === 'object') {
        const rawObj = raw as Record<string, unknown>;
        if (Array.isArray(rawObj.data)) return normalizeIndicatorsList(rawObj.data);
        if (rawObj.data && typeof rawObj.data === 'object') {
          const nested = rawObj.data as Record<string, unknown>;
          if (Array.isArray(nested.data)) return normalizeIndicatorsList(nested.data);
        }
      }

      return [];
    };

    const loadIndicators = async (currentSelectedId: number | null) => {
      try {
        const excludedIds = new Set<number>(Array.isArray(existingItemIds) ? existingItemIds : []);
        if (currentSelectedId != null) excludedIds.delete(Number(currentSelectedId));

        const response = await GetIndicatorsListService({ perPage: 1000 });
        const normalized = normalizeIndicatorsList(response?.data);
        const filtered = excludedIds.size ? normalized.filter((it) => !excludedIds.has(it.id)) : normalized;
        if (!active) return;
        setItems(filtered);
      } catch (e) {
        console.error('Error loading indicators:', e);
        toast.error('Error al cargar indicadores');
      }
    };

    const prime = async () => {
      setSubmitted(false);
      const initialSelectedId = getFiniteNumber(initialData?.indicatorId ?? initialData?.indicator?.id);
      const initialObservations = typeof initialData?.observations === 'string' ? initialData.observations : '';

      if (relationId) {
        try {
          setLoading(true);
          const res = await GetProcessIndicatorByIdService(relationId);
          if (!active) return;

          const selectedId = getFiniteNumber(res.data?.indicator?.id ?? res.data?.indicatorId);
          setForm({
            itemId: selectedId,
            observations: typeof res.data?.observations === 'string' ? res.data.observations : '',
          });
          await loadIndicators(selectedId);
        } catch (e) {
          console.error('Error loading process indicator:', e);
          toast.error('Error al cargar indicador del proceso');
          setForm({ itemId: initialSelectedId, observations: initialObservations });
          await loadIndicators(initialSelectedId);
        } finally {
          if (active) setLoading(false);
        }
        return;
      }

      setForm({ itemId: initialSelectedId, observations: initialObservations });
      await loadIndicators(initialSelectedId);
    };

    prime();

    return () => {
      active = false;
    };
  }, [open, relationId, initialData, existingItemIds]);

  const options: IndicatorOption[] = useMemo(
    () =>
      items.map((i) => {
        const name = i.indicatorName ?? i.name;
        const code = i.indicatorCode ?? i.code;
        const baseLabel = name || `#${i.id}`;
        return { id: i.id, label: code ? `${baseLabel} (${code})` : baseLabel };
      }),
    [items]
  );

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!processId || !form.itemId) {
      toast.error(t('process.map.modals.common.missingData'));
      return;
    }
    const payload = {
      observations: form.observations || ' ',
      processId: Number(processId),
      indicatorId: Number(form.itemId),
    };
    try {
      setLoading(true);
      if (relationId) {
        await UpdateProcessIndicatorService(relationId, payload);
      } else {
        await SaveProcessIndicatorService(payload);
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
          {t('process.map.modals.indicator.title')}
        </Typography>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={options}
            value={options.find((o) => o.id === form.itemId) || null}
            onChange={(_event: SyntheticEvent, v: IndicatorOption | null) => setForm((f) => ({ ...f, itemId: v?.id ?? null }))}
            renderInput={(params: AutocompleteRenderInputParams) => (
              <TextField
                {...params}
                label={t('process.map.modals.indicator.fieldLabel')}
                error={submitted && !form.itemId}
                helperText={submitted && !form.itemId ? t('process.map.modals.common.missingData') : ''}
              />
            )}
          />
          <TextField 
            label={t('process.map.modals.common.observations')} 
            value={form.observations} 
            onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))}
            multiline
            rows={3}
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
                    await DeleteProcessIndicatorService(relationId);
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
