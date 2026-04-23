'use client';

import { useMemo, useState, useEffect } from 'react';

import { Box, Stack, Drawer, Button, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetDocumentsListService, SaveProcessDocumentService, UpdateProcessDocumentService, DeleteProcessDocumentService } from 'src/services/architecture/process/processRelations.service';

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

export function ProcessDocumentLinkModal({ open, onClose, onSuccess, processId, existingItemIds, relationId, initialData, allowDelete }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    itemId: null as null | number,
    observations: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setOptionsLoading(true);
        const currentSelectedId = initialData?.documentId ?? initialData?.document?.id ?? null;
        const excludedIds = new Set<number>(Array.isArray(existingItemIds) ? existingItemIds : []);
        if (currentSelectedId != null) excludedIds.delete(Number(currentSelectedId));

        const response = await GetDocumentsListService();
        // Process Documents
        const raw = response?.data;
        let list: any[] = [];

        if (Array.isArray(raw)) {
          // Handle [data, count] format
          if (raw.length >= 1 && Array.isArray(raw[0])) {
            list = raw[0];
          } else {
            list = raw;
          }
        } else if (Array.isArray(raw?.data)) {
          list = raw.data;
        } else if (Array.isArray(raw?.data?.data)) {
          list = raw.data.data;
        }
        
        const normalized = Array.isArray(list) ? list : [];
        const filtered = excludedIds.size
          ? normalized.filter((it: any) => !excludedIds.has(Number(it?.id)))
          : normalized;
        setItems(filtered);
      } catch (e) {
        console.error('Error loading documents:', e);
        toast.error(t('process.map.modals.common.loadError'));
      } finally {
        setOptionsLoading(false);
      }
    };
    if (open) {
      setSubmitted(false);
      setForm({
        itemId: initialData?.documentId ?? initialData?.document?.id ?? null,
        observations: initialData?.observations ?? '',
      });
      load();
    }
  }, [open, t, initialData, existingItemIds]);

  const options = useMemo(
    () => items.map((i: any) => ({ label: String(i?.name ?? i?.label ?? `#${i?.id}`), id: i?.id })),
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
      documentId: Number(form.itemId)
    };
    try {
      setLoading(true);
      if (relationId) {
        await UpdateProcessDocumentService(relationId, payload);
      } else {
        await SaveProcessDocumentService(payload);
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
          {t('process.map.modals.document.title')}
        </Typography>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={options}
            value={options.find((o) => o.id === form.itemId) || null}
            onChange={(_: any, v: any) => setForm((f) => ({ ...f, itemId: v?.id || null }))}
            loading={optionsLoading}
            renderInput={(params: any) => (
              <TextField
                {...params}
                label={t('process.map.modals.document.fieldLabel')}
                error={submitted && !form.itemId}
                helperText={submitted && !form.itemId ? t('process.map.modals.common.missingData') : ''}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {optionsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
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
                    await DeleteProcessDocumentService(relationId);
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
