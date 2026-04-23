'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import { Stack, Drawer, Divider, Typography, IconButton } from '@mui/material';

import axios from 'src/utils/axios';

import { useTranslate } from 'src/locales';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import {
  AuditFrotm,
  type AuditRating,
  buildAuditPayload,
  type AuditFrotmValues,
  type AuditSelectOption,
  type AuditRelationOption,
} from 'src/sections/architecture/common/audit-frotm';

import { useAuthContext } from 'src/auth/hooks';

type Props = {
  open: boolean;
  onClose: () => void;
  systemId: number;
  systemLabel?: string;
  auditId?: number | null;
  onSuccess?: () => void;
};

type AuditApiRecord = {
  id: number;
  date?: string | null;
  report?: string | null;
  recommendations?: string | null;
  status?: boolean | null;
  lastReview?: string | null;
  collaborators?: string | null;
  type?: string | null;
  comments?: string | null;
  processCompliance?: AuditRating | null;
  organizationCompliance?: AuditRating | null;
  policiesCompliance?: AuditRating | null;
  toolsUsage?: AuditRating | null;
  deliverablesCompliance?: AuditRating | null;
  file?: string | null;
};

const isAuditRating = (value: unknown): value is AuditRating => {
  if (typeof value !== 'string') return false;
  return (
    value === '' ||
    value === 'excellent' ||
    value === 'good' ||
    value === 'needsImprovement' ||
    value === 'urgentImprovement' ||
    value === 'notApplicable'
  );
};

function normalizeRecord(raw: unknown): AuditApiRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const id = Number(rec.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    date: typeof rec.date === 'string' ? rec.date : null,
    report: typeof rec.report === 'string' ? rec.report : null,
    recommendations: typeof rec.recommendations === 'string' ? rec.recommendations : null,
    status: typeof rec.status === 'boolean' ? rec.status : null,
    lastReview: typeof rec.lastReview === 'string' ? rec.lastReview : null,
    collaborators: typeof rec.collaborators === 'string' ? rec.collaborators : null,
    type: typeof rec.type === 'string' ? rec.type : null,
    comments: typeof rec.comments === 'string' ? rec.comments : null,
    processCompliance: isAuditRating(rec.processCompliance) ? rec.processCompliance : null,
    organizationCompliance:
      isAuditRating(rec.organizationCompliance) ? rec.organizationCompliance : null,
    policiesCompliance: isAuditRating(rec.policiesCompliance) ? rec.policiesCompliance : null,
    toolsUsage: isAuditRating(rec.toolsUsage) ? rec.toolsUsage : null,
    deliverablesCompliance:
      isAuditRating(rec.deliverablesCompliance) ? rec.deliverablesCompliance : null,
    file: typeof rec.file === 'string' ? rec.file : null,
  };
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return 'Error';
  const rec = error as Record<string, unknown>;
  if (typeof rec.message === 'string') return rec.message;
  return 'Error';
}

export function ApplicationSystemAuditsDrawer({
  open,
  onClose,
  systemId,
  systemLabel,
  auditId,
  onSuccess,
}: Props) {
  const { t } = useTranslate('architecture');
  const { user } = useAuthContext();

  const [currentAudit, setCurrentAudit] = useState<AuditApiRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const isEdit = auditId != null;

  const relatedSystemOptions = useMemo<AuditRelationOption[]>(
    () => [{ id: String(systemId), label: systemLabel ?? `#${systemId}` }],
    [systemId, systemLabel]
  );

  const typeOptions = useMemo<AuditSelectOption[]>(
    () => [
      { value: 'Auditoría Interna', label: t('audit.form.type.options.internal') },
      { value: 'Auditoría Externa', label: t('audit.form.type.options.external') },
    ],
    [t]
  );

  const statusOptions = useMemo<AuditSelectOption[]>(
    () => [
      { value: 'Activo', label: t('audit.form.status.options.active') },
      { value: 'Inactivo', label: t('audit.form.status.options.inactive') },
    ],
    [t]
  );

  const resolvedUserName =
    typeof user?.displayName === 'string' && user.displayName.trim().length
      ? user.displayName
      : typeof user?.email === 'string'
        ? user.email
        : '';

  const loadAudit = useCallback(async () => {
    if (!open || auditId == null) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/audits/system/${encodeURIComponent(String(systemId))}/${encodeURIComponent(String(auditId))}`);
      const record = normalizeRecord((res as { data?: unknown })?.data);
      if (!record) {
        toast.error(t('application.table.messages.error.loading'));
        setCurrentAudit(null);
        return;
      }
      setCurrentAudit(record);
    } catch (error) {
      setCurrentAudit(null);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [auditId, open, systemId, t]);

  useEffect(() => {
    if (!open) return;
    setCurrentAudit(null);
    loadAudit();
  }, [loadAudit, open]);

  const formDefaults = useMemo<Partial<AuditFrotmValues>>(() => {
    const base: Partial<AuditFrotmValues> = {
      relatedSystems: relatedSystemOptions,
      user: resolvedUserName,
    };

    if (!currentAudit) return base;

    return {
      ...base,
      date: currentAudit.date ?? null,
      report: currentAudit.report ?? '',
      recommendations: currentAudit.recommendations ?? '',
      comments: currentAudit.comments ?? '',
      status: currentAudit.status == null ? '' : currentAudit.status ? 'Activo' : 'Inactivo',
      lastReview: currentAudit.lastReview ?? null,
      collaborators: currentAudit.collaborators ?? '',
      type: currentAudit.type ?? '',
      processCompliance: currentAudit.processCompliance ?? '',
      organizationCompliance: currentAudit.organizationCompliance ?? '',
      policiesCompliance: currentAudit.policiesCompliance ?? '',
      toolsUsage: currentAudit.toolsUsage ?? '',
      deliverablesCompliance: currentAudit.deliverablesCompliance ?? '',
      file: currentAudit.file ?? null,
    };
  }, [currentAudit, relatedSystemOptions, resolvedUserName]);

  const handleSubmit = useCallback(
    async (values: AuditFrotmValues) => {
      const payload = buildAuditPayload(values);

      try {
        if (isEdit && auditId != null) {
          await axios.patch(
            `/api/audits/system/${encodeURIComponent(String(systemId))}/${encodeURIComponent(String(auditId))}`,
            payload
          );
          toast.success(t('application.table.messages.success.updated'));
        } else {
          await axios.post(`/api/audits/system/${encodeURIComponent(String(systemId))}`, payload);
          toast.success(t('application.table.messages.success.created'));
        }
        onSuccess?.();
        onClose();
      } catch {
        toast.error(
          isEdit ? t('application.table.messages.error.updating') : t('application.table.messages.error.creating')
        );
      }
    },
    [auditId, isEdit, onClose, onSuccess, systemId, t]
  );

  const title = systemLabel
    ? `${t('audit.form.fields.relatedSystems.label')}: ${systemLabel}`
    : t('audit.form.fields.relatedSystems.label');

  return (
    <Drawer open={open} onClose={onClose} anchor="right" PaperProps={{ sx: { width: { xs: 1, md: 720 } } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? t('application.map.diagram.loadingMap') : ' '}
          </Typography>
        </Stack>

        <IconButton onClick={onClose} aria-label={t('application.table.actions.cancel')}>
          <Iconify icon="solar:close-circle-bold" />
        </IconButton>
      </Stack>

      <Divider />

      <Scrollbar sx={{ height: 1 }}>
        <AuditFrotm
          open={open}
          userName={resolvedUserName}
          defaultValues={formDefaults}
          relatedSystemOptions={relatedSystemOptions}
          typeOptions={typeOptions}
          statusOptions={statusOptions}
          fileEnabled={false}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </Scrollbar>
    </Drawer>
  );
}
