'use client';

import { useMemo, useState, useEffect } from 'react';

import { Box, Stack, Drawer, Button, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetDocumentsListService, SaveProcessDocumentService } from 'src/services/architecture/process/processRelations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processId: number | string | null;
};

export function ProcessDocumentLinkModal({ open, onClose, onSuccess, processId }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    itemId: null as null | number,
    observations: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const response = await GetDocumentsListService({ perPage: 1000 });
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
        
        setItems(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Error loading documents:', e);
        toast.error(t('process.map.modals.common.loadError'));
      }
    };
    if (open) {
      setForm({ itemId: null, observations: '' });
      load();
    }
  }, [open, t]);

  const options = useMemo(() => items.map((i: any) => ({ label: i?.name || `#${i?.id}`, id: i?.id })), [items]);

  const handleSubmit = async () => {
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
      await SaveProcessDocumentService(payload);
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
            renderInput={(params: any) => <TextField {...params} label={t('process.map.modals.document.fieldLabel')} />}
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
