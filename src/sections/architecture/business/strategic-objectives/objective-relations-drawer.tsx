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
  SaveObjectiveProcessRelationService,
  SaveDocumentObjectiveRelationService,
  SaveObjectiveIndicatorRelationService,
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

export function ObjectiveRelationsDrawer({ open, onClose, onSuccess, objectiveId, kind }: Props) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [impact, setImpact] = useState('');
  const [role, setRole] = useState('');
  const [observations, setObservations] = useState('');
  const [creationDate, setCreationDate] = useState('');

  const title = useMemo(() => {
    if (kind === 'process') return 'Relacionar Proceso';
    if (kind === 'job') return 'Relacionar Actor';
    if (kind === 'document') return 'Relacionar Documento';
    return 'Relacionar Indicador';
  }, [kind]);

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
            const code = it?.code;
            const label = `${String(name ?? `#${id}`)}${code ? ` (${String(code)})` : ''}`;
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
  }, [kind]);

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setImpact('');
    setRole('');
    setObservations('');
    setCreationDate(new Date().toISOString());
    loadOptions();
  }, [open, loadOptions]);

  const handleSubmit = async () => {
    if (!objectiveId || !selectedId) {
      toast.error('Seleccione un elemento para relacionar');
      return;
    }

    try {
      setLoading(true);

      if (kind === 'process') {
        if (!impact) {
          toast.error('Seleccione un impacto');
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
      onSuccess();
      onClose();
    } catch {
      toast.error('Error al guardar la relación');
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
            options={options}
            value={selectedOption}
            loading={loading}
            onChange={(_, v) => setSelectedId(v?.id ?? null)}
            getOptionLabel={(opt) => opt.label}
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
              label="Fecha de creación"
              value={creationDate}
              disabled
              helperText="Se usará la fecha de hoy automáticamente"
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
                loading ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="mingcute:add-line" />
              }
            >
              Relacionar
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
