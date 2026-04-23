'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Stack,
  Drawer,
  Button,
  Divider,
  TextField,
  Typography,
  IconButton,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import axios, { endpoints } from 'src/utils/axios';

import { useTranslate } from 'src/locales';
import {
  SaveSystemDocumentRelationService,
  UpdateSystemDocumentRelationService,
  GetSystemDocumentRelationByIdService,
} from 'src/services/architecture/documents/systemDocuments.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type Option = { id: number; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  systemId: number;
  systemLabel?: string;
  relationId?: number | null;
  onSuccess?: () => void;
  sx?: SxProps<Theme>;
};

type DocumentEntity = {
  id: number;
  code?: string | null;
  name: string;
  description?: string | null;
  version?: number | null;
  writingDate?: string | null;
  expirationDate?: string | null;
  modificationDate?: string | null;
  file?: string | null;
  type?: string | null;
  link?: string | null;
  originalFile?: string | null;
  ranking?: number | null;
  active?: boolean | null;
  documentStatus?: unknown;
  documentType?: unknown;
  user?: unknown;
  author?: unknown;
  verifier?: unknown;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
};

function isDocumentEntity(value: unknown): value is DocumentEntity {
  if (!value || typeof value !== 'object') return false;
  const rec = value as Record<string, unknown>;
  return typeof rec.id === 'number' && typeof rec.name === 'string';
}

function normalizeList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    if (Array.isArray(raw[0])) return raw[0];
    return raw;
  }

  if (raw && typeof raw === 'object') {
    const maybe = raw as Record<string, unknown>;

    if (Array.isArray(maybe.data)) return maybe.data;
    if (maybe.data && typeof maybe.data === 'object') {
      const inner = maybe.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) return inner.data;
      if (Array.isArray(inner.items)) return inner.items;
    }
    if (Array.isArray(maybe.items)) return maybe.items;
  }

  return [];
}

export function ApplicationSystemDocumentsDrawer({
  open,
  onClose,
  systemId,
  systemLabel,
  relationId,
  onSuccess,
  sx,
}: Props) {
  const { t } = useTranslate('architecture');

  const [saving, setSaving] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [relationLoading, setRelationLoading] = useState(false);

  const [documentOptions, setDocumentOptions] = useState<Option[]>([]);

  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [observations, setObservations] = useState('');

  const isEditing = relationId != null;

  const selectedDocumentOption = useMemo(() => {
    if (selectedDocumentId == null) return null;
    return documentOptions.find((o) => o.id === selectedDocumentId) ?? null;
  }, [documentOptions, selectedDocumentId]);

  const loadDocuments = useCallback(async () => {
    try {
      setDocumentsLoading(true);
      const res = await axios.get(endpoints.architecture.documents.table.allList);
      const list = normalizeList((res as { data?: unknown })?.data);

      const mapped: Option[] = list
        .map((it) => {
          if (!isDocumentEntity(it)) return null;
          const id = it.id;
          const label = it.name.trim().length > 0 ? it.name : `#${id}`;
          return { id, label };
        })
        .filter((o): o is Option => Boolean(o));

      setDocumentOptions(mapped);
    } catch {
      setDocumentOptions([]);
      toast.error(t('application.map.systemDocuments.messages.documentsLoadError'));
    } finally {
      setDocumentsLoading(false);
    }
  }, [t]);

  const resetForm = useCallback(() => {
    setSelectedDocumentId(null);
    setObservations('');
  }, []);

  const loadRelationById = useCallback(async () => {
    if (relationId == null) return;
    try {
      setRelationLoading(true);
      const res = await GetSystemDocumentRelationByIdService(relationId);
      const rec = (res as { data?: unknown })?.data as
        | {
            observations?: unknown;
            system?: { id?: unknown } | null;
            systemId?: unknown;
            document?: { id?: unknown } | null;
            documentId?: unknown;
            document_id?: unknown;
          }
        | undefined;

      const sysId = Number((rec as { systemId?: unknown } | undefined)?.systemId ?? rec?.system?.id);
      const docId = Number(
        (rec as { documentId?: unknown; document_id?: unknown } | undefined)?.documentId ??
          (rec as { document_id?: unknown } | undefined)?.document_id ??
          rec?.document?.id
      );

      if (!Number.isFinite(docId) || !Number.isFinite(sysId) || sysId !== systemId) {
        toast.error(t('application.map.systemDocuments.messages.loadError'));
        return;
      }

      setSelectedDocumentId(docId);
      setObservations(String(rec?.observations ?? ''));
    } catch {
      toast.error(t('application.map.systemDocuments.messages.loadError'));
    } finally {
      setRelationLoading(false);
    }
  }, [relationId, systemId, t]);

  useEffect(() => {
    if (!open) return () => {};

    resetForm();
    loadDocuments();
    loadRelationById();
    return () => {};
  }, [loadDocuments, loadRelationById, open, resetForm]);

  const handleSubmit = useCallback(async () => {
    if (selectedDocumentId == null) {
      toast.error(t('application.map.systemDocuments.form.validation.documentRequired'));
      return;
    }

    try {
      setSaving(true);

      const payload = {
        observations: observations.trim() ? observations.trim() : undefined,
        system: { id: systemId },
        document: { id: selectedDocumentId },
      };

      if (relationId != null) {
        await UpdateSystemDocumentRelationService(relationId, payload);
        toast.success(t('application.map.systemDocuments.messages.updated'));
      } else {
        await SaveSystemDocumentRelationService(payload);
        toast.success(t('application.map.systemDocuments.messages.created'));
      }

      onSuccess?.();
      onClose();
    } catch {
      toast.error(t('application.map.systemDocuments.messages.saveError'));
    } finally {
      setSaving(false);
    }
  }, [observations, onClose, onSuccess, relationId, selectedDocumentId, systemId, t]);

  const title = systemLabel
    ? t('application.map.systemDocuments.titleWithSystem', { system: systemLabel })
    : t('application.map.systemDocuments.title');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      PaperProps={{ sx: { width: { xs: 1, sm: 520, md: 680 }, ...sx } }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('application.map.systemDocuments.subtitle')}
          </Typography>
        </Stack>

        <IconButton onClick={onClose} aria-label={t('application.map.systemDocuments.actions.close')}>
          <Iconify icon="solar:close-circle-bold" />
        </IconButton>
      </Stack>

      <Divider />

      <Stack spacing={2.5} sx={{ px: 3, py: 2.5 }}>
        <Typography variant="subtitle2">{t('application.map.systemDocuments.form.title')}</Typography>

        <Autocomplete
          options={documentOptions}
          value={selectedDocumentOption}
          onChange={(_, value) => setSelectedDocumentId(value?.id ?? null)}
          getOptionLabel={(option) => option.label}
          loading={documentsLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('application.map.systemDocuments.form.fields.document')}
              placeholder={t('application.map.systemDocuments.form.fields.document')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {documentsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          disabled={saving || relationLoading}
        />

        <TextField
          label={t('application.map.systemDocuments.form.fields.observations')}
          placeholder={t('application.map.systemDocuments.form.fields.observations')}
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          disabled={saving || relationLoading}
          multiline
          minRows={3}
        />

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving || relationLoading}
            startIcon={
              saving ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="solar:check-circle-bold" />
            }
          >
            {isEditing ? t('application.map.systemDocuments.actions.update') : t('application.map.systemDocuments.actions.create')}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
