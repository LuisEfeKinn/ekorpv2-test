'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Stack,
  Drawer,
  Button,
  MenuItem,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { GetJobsPaginationService } from 'src/services/architecture/business/jobs.service';
import { GetProcessTablePaginationService } from 'src/services/architecture/process/processTable.service';
import { GetDocumentsListService, GetIndicatorsListService } from 'src/services/architecture/process/processRelations.service';
import {
  SaveJobObjectiveRelationService,
  UpdateJobObjectiveRelationService,
  GetJobObjectiveRelationByIdService,
  SaveObjectiveProcessRelationService,
  SaveDocumentObjectiveRelationService,
  SaveObjectiveIndicatorRelationService,
  UpdateObjectiveProcessRelationService,
  UpdateDocumentObjectiveRelationService,
  GetObjectiveProcessRelationByIdService,
  UpdateObjectiveIndicatorRelationService,
  GetDocumentObjectiveRelationByIdService,
  GetObjectiveIndicatorRelationByIdService,
} from 'src/services/architecture/business/objectiveRelations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type RelationKind = 'process' | 'job' | 'document' | 'indicator';

type Option = { id: number; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  objectiveId: number;
  kind: RelationKind;
  editMode?: boolean;
  initialData?: any;
  relationId?: number;
  existingItemIds?: number[];
  existingItemLabels?: string[];
};

function normalizeList(raw: any): any[] {
  if (Array.isArray(raw)) {
    if (Array.isArray(raw[0])) return raw[0];
    return raw;
  }
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.data)) return raw.data;
    if (raw.data && typeof raw.data === 'object') {
      if (Array.isArray((raw.data as any).data)) return (raw.data as any).data;
      if (Array.isArray((raw.data as any).items)) return (raw.data as any).items;
    }
    if (Array.isArray((raw as any).items)) return (raw as any).items;
    if (typeof (raw as any).statusCode === 'number' && (raw as any).data) {
      const inner = (raw as any).data;
      if (Array.isArray(inner)) return inner;
      if (inner && typeof inner === 'object') {
        if (Array.isArray(inner.data)) return inner.data;
        if (Array.isArray(inner.items)) return inner.items;
      }
    }
  }
  return [];
}

function normalizeComparableLabel(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
}

export function ObjectiveRelationsDrawer({ open, onClose, onSuccess, objectiveId, kind, editMode, initialData, relationId, existingItemIds, existingItemLabels }: Props) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [impact, setImpact] = useState('');
  const [role, setRole] = useState('');
  const [observations, setObservations] = useState('');
  const [creationDate, setCreationDate] = useState('');

  const excludedIds = useMemo(() => new Set(existingItemIds ?? []), [existingItemIds]);
  const excludedLabels = useMemo(() => {
    const set = new Set<string>();
    (existingItemLabels ?? []).forEach((l) => {
      const normalized = normalizeComparableLabel(String(l ?? ''));
      if (normalized) set.add(normalized);
    });
    return set;
  }, [existingItemLabels]);

  const filteredOptions = useMemo(() => {
    if (excludedIds.size === 0 && excludedLabels.size === 0) return options;

    const isExcluded = (opt: Option) => {
      if (excludedIds.has(opt.id)) return true;
      return excludedLabels.has(normalizeComparableLabel(opt.label));
    };

    if (editMode && selectedId != null) {
      return options.filter((opt) => !isExcluded(opt) || opt.id === selectedId);
    }
    return options.filter((opt) => !isExcluded(opt));
  }, [editMode, excludedIds, excludedLabels, options, selectedId]);

  const title = useMemo(() => {
    const prefix = editMode ? 'Editar Relación' : 'Relacionar';
    if (kind === 'process') return `${prefix} Proceso`;
    if (kind === 'job') return `${prefix} Actor`;
    if (kind === 'document') return `${prefix} Documento`;
    return `${prefix} Indicador`;
  }, [kind, editMode]);

  const loadOptions = useCallback(async () => {
    try {
      setLoading(true);

      let res;
      if (kind === 'process') {
        res = await GetProcessTablePaginationService({ page: 1, perPage: 1000 });
      } else if (kind === 'job') {
        res = await GetJobsPaginationService({ page: 1, perPage: 1000 });
      } else if (kind === 'document') {
        res = await GetDocumentsListService({ page: 1, perPage: 1000 });
      } else {
        res = await GetIndicatorsListService({ page: 1, perPage: 1000 });
      }

      const list = normalizeList(res?.data);

      const mapped: Option[] = list
        .map((it: any) => {
          const id = Number(it?.id);

          if (kind === 'indicator') {
            const name = it?.indicatorName ?? it?.name ?? it?.label;
            const code = it?.indicatorCode ?? it?.code;
            const label = `${String(name ?? `#${id}`)}${code ? ` (${String(code)})` : ''}`;
            return { id, label };
          }

          if (kind === 'job') {
            const name = it?.name ?? it?.label;
            const label = String(name ?? `#${id}`);
            return { id, label };
          }

          return {
            id,
            label: String(it?.name ?? it?.label ?? it?.code ?? `#${id}`),
          };
        })
        .filter((it: Option) => Number.isFinite(it.id));

      setOptions(mapped);
    } catch {
      setOptions([]);
      toast.error('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [editMode, excludedIds, kind]);

  useEffect(() => {
    if (!open) return () => {};

    let active = true;

    const applyDataToForm = (raw: unknown) => {
      const base =
        raw && typeof raw === 'object' && 'data' in (raw as { data?: unknown })
          ? (raw as { data?: unknown }).data
          : raw;

      const data = (base && typeof base === 'object' ? (base as Record<string, unknown>) : {}) as Record<
        string,
        unknown
      >;

      const pickId = () => {
        const itemId = data.itemId;
        if (typeof itemId === 'number' || typeof itemId === 'string') return Number(itemId);

        if (kind === 'process') {
          const id = data.processId ?? (data.process as { id?: unknown } | undefined)?.id;
          return typeof id === 'number' || typeof id === 'string' ? Number(id) : NaN;
        }
        if (kind === 'job') {
          const id = data.jobId ?? (data.job as { id?: unknown } | undefined)?.id;
          return typeof id === 'number' || typeof id === 'string' ? Number(id) : NaN;
        }
        if (kind === 'document') {
          const id = data.documentId ?? (data.document as { id?: unknown } | undefined)?.id;
          return typeof id === 'number' || typeof id === 'string' ? Number(id) : NaN;
        }
        const id = data.indicatorId ?? (data.indicator as { id?: unknown } | undefined)?.id;
        return typeof id === 'number' || typeof id === 'string' ? Number(id) : NaN;
      };

      const relatedId = pickId();

      setSelectedId(Number.isFinite(relatedId) && relatedId > 0 ? relatedId : null);
      setImpact(typeof data.impact === 'string' ? data.impact : '');
      setRole(typeof data.role === 'string' ? data.role : '');
      setObservations(typeof data.observations === 'string' ? data.observations : '');
      setCreationDate(typeof data.creationDate === 'string' ? data.creationDate : new Date().toISOString());
    };

    const prefill = async () => {
      if (!editMode) {
        setSelectedId(null);
        setImpact('');
        setRole('');
        setObservations('');
        setCreationDate(new Date().toISOString());
        return;
      }

      const id = typeof relationId === 'number' && Number.isFinite(relationId) && relationId > 0 ? relationId : null;

      if (id == null) {
        if (initialData) applyDataToForm(initialData);
        return;
      }

      try {
        const res =
          kind === 'process'
            ? await GetObjectiveProcessRelationByIdService(id)
            : kind === 'job'
              ? await GetJobObjectiveRelationByIdService(id)
              : kind === 'document'
                ? await GetDocumentObjectiveRelationByIdService(id)
                : await GetObjectiveIndicatorRelationByIdService(id);

        if (!active) return;
        applyDataToForm(res?.data);
      } catch {
        if (!active) return;
        if (initialData) applyDataToForm(initialData);
      }
    };

    loadOptions();
    prefill();

    return () => {
      active = false;
    };
  }, [editMode, initialData, kind, loadOptions, open, relationId]);

  const handleSubmit = async () => {
    if (!objectiveId || !selectedId) {
      toast.error('Seleccione un elemento para relacionar');
      return;
    }

    const selectedOption = options.find((o) => o.id === selectedId) || null;
    const selectedComparableLabel = selectedOption ? normalizeComparableLabel(selectedOption.label) : '';

    if (!editMode && (excludedIds.has(selectedId) || (selectedComparableLabel && excludedLabels.has(selectedComparableLabel)))) {
      toast.error('Este elemento ya está relacionado');
      return;
    }

    try {
      setLoading(true);

      if (editMode && relationId) {
        if (kind === 'process') {
          if (!impact) {
            toast.error('Seleccione un impacto');
            setLoading(false);
            return;
          }
          await UpdateObjectiveProcessRelationService(relationId, {
            impact,
            process: { id: Number(selectedId) },
            objective: { id: Number(objectiveId) },
          });
        } else if (kind === 'job') {
          if (!role) {
            toast.error('Seleccione un rol');
            setLoading(false);
            return;
          }
          await UpdateJobObjectiveRelationService(relationId, {
            role,
            job: { id: Number(selectedId) },
            objective: { id: Number(objectiveId) },
          });
        } else if (kind === 'document') {
          await UpdateDocumentObjectiveRelationService(relationId, {
            observations: observations?.trim() || undefined,
            document: { id: Number(selectedId) },
            objective: { id: Number(objectiveId) },
          });
        } else if (kind === 'indicator') {
          await UpdateObjectiveIndicatorRelationService(relationId, {
            observations: observations?.trim() || undefined,
            creationDate,
            indicator: { id: Number(selectedId) },
            objective: { id: Number(objectiveId) },
          });
        }
        toast.success('Relación actualizada');
      } else {
        if (kind === 'process') {
          if (!impact) {
            toast.error('Seleccione un impacto');
            setLoading(false);
            return;
          }
          await SaveObjectiveProcessRelationService({
            impact,
            process: { id: Number(selectedId) },
            objective: { id: Number(objectiveId) },
          });
        }

        if (kind === 'job') {
          if (!role) {
            toast.error('Seleccione un rol');
            setLoading(false);
            return;
          }
          await SaveJobObjectiveRelationService({
            role,
            job: { id: Number(selectedId) },
            objective: { id: Number(objectiveId) },
          });
        }

        if (kind === 'document') {
          await SaveDocumentObjectiveRelationService({
            observations: observations?.trim() || undefined,
            document: { id: Number(selectedId) },
            objective: { id: Number(objectiveId) },
          });
        }

        if (kind === 'indicator') {
          await SaveObjectiveIndicatorRelationService({
            observations: observations?.trim() || undefined,
            creationDate,
            indicator: { id: Number(selectedId) },
            objective: { id: Number(objectiveId) },
          });
        }
        toast.success('Relación guardada');
      }

      onSuccess();
      onClose();
    } catch {
      toast.error(editMode ? 'Error al actualizar' : 'Error al guardar la relación');
    } finally {
      setLoading(false);
    }
  };

  const selectedOption = options.find((o) => o.id === selectedId) || null;

  const showObservations = kind === 'document' || kind === 'indicator';

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 440 } }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title}
        </Typography>

        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={filteredOptions}
            value={selectedOption}
            loading={loading}
            onChange={(_, v) => setSelectedId(v?.id ?? null)}
            disabled={editMode}
            getOptionLabel={(opt) => opt.label}
            getOptionDisabled={(opt) =>
              !editMode && (excludedIds.has(opt.id) || excludedLabels.has(normalizeComparableLabel(opt.label)))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Seleccione"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {kind === 'process' && (
            <TextField select label="Impacto" value={impact} onChange={(e) => setImpact(e.target.value)}>
              <MenuItem value="" disabled>
                Seleccione
              </MenuItem>
              <MenuItem value="A">Alto</MenuItem>
              <MenuItem value="M">Medio</MenuItem>
              <MenuItem value="B">Bajo</MenuItem>
            </TextField>
          )}

          {kind === 'job' && (
            <TextField select label="Rol" value={role} onChange={(e) => setRole(e.target.value)}>
              <MenuItem value="" disabled>
                Seleccione
              </MenuItem>
              <MenuItem value="R">Principal</MenuItem>
              <MenuItem value="S">Secundario</MenuItem>
            </TextField>
          )}

          {showObservations && (
            <TextField
              label="Observaciones"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              multiline
              minRows={3}
            />
          )}

          {kind === 'indicator' && (
            <TextField
              label={editMode ? "Fecha de creación (registrada)" : "Fecha de creación"}
              value={creationDate}
              disabled
              helperText={editMode ? "Fecha registrada en la relación" : "Se usará la fecha de hoy automáticamente"}
            />
          )}

          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={18} color="inherit" /> : <Iconify icon={editMode ? "solar:pen-bold" : "mingcute:add-line"} />
              }
            >
              {editMode ? 'Guardar Cambios' : 'Relacionar'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
