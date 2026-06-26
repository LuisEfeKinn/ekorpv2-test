'use client';

import type { IAssignment, ICatalogOption, IAssignmentFilters } from 'src/types/project-management';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState, useDebounce } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Pagination from '@mui/material/Pagination';
import Autocomplete from '@mui/material/Autocomplete';

import { useTranslate } from 'src/locales';
import { GetWorkersPaginationService } from 'src/services/project-management/worker.service';
import { GetAssignmentStatusesService } from 'src/services/project-management/filters.service';
import {
  DeleteAssignmentService,
  GetAssignmentsPaginationService,
} from 'src/services/project-management/assignment.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { AssignmentCard } from './assignment-card';
import { useProjectView } from '../project-view-context';
import { AssignmentCreateEditDrawer } from './assignment-create-edit-drawer';

// ----------------------------------------------------------------------

type Props = {
  projectId: string;
};

const PER_PAGE = 12;

export function ProjectTeamTab({ projectId }: Props) {
  const { t } = useTranslate('project-management');
  const { canManageTeam } = useProjectView();
  const drawer = useBoolean();

  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [currentRow, setCurrentRow] = useState<IAssignment | null>(null);
  const [loading, setLoading] = useState(false);

  const [statusOptions, setStatusOptions] = useState<ICatalogOption[]>([]);
  const [workerOptions, setWorkerOptions] = useState<{ id: string; fullName: string }[]>([]);

  const filters = useSetState<IAssignmentFilters>({ search: '', statusId: '', employeeId: '' });
  const { state: currentFilters, setState: updateFilters } = filters;
  const debouncedSearch = useDebounce(currentFilters.search, 300);

  const loadStatusOptions = useCallback(async () => {
    const response = await GetAssignmentStatusesService();
    setStatusOptions(response.data ?? []);
  }, []);

  const loadWorkerOptions = useCallback(async (search?: string) => {
    const response = await GetWorkersPaginationService({ page: 1, perPage: 15, search });
    setWorkerOptions(
      (response.data?.data ?? []).map((w: any) => ({ id: w.id, fullName: w.fullName }))
    );
  }, []);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetAssignmentsPaginationService({
        page,
        perPage: PER_PAGE,
        projectId: Number(projectId),
        search: debouncedSearch || undefined,
        statusId: currentFilters.statusId ? Number(currentFilters.statusId) : undefined,
        employeeId: currentFilters.employeeId ? Number(currentFilters.employeeId) : undefined,
      });
      setAssignments(response.data?.data ?? []);
      setTotalItems(response.data?.meta?.itemCount ?? 0);
    } catch {
      toast.error(t('detail.team.messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [page, projectId, debouncedSearch, currentFilters.statusId, currentFilters.employeeId, t]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    loadStatusOptions();
    loadWorkerOptions();
  }, [loadStatusOptions, loadWorkerOptions]);

  const handleDelete = async (id: string) => {
    try {
      await DeleteAssignmentService(id);
      toast.success(t('detail.team.messages.unassigned'));
      fetchAssignments();
    } catch {
      toast.error(t('detail.team.messages.errorUnassign'));
    }
  };

  const handleEdit = (assignment: IAssignment) => {
    setCurrentRow(assignment);
    drawer.onTrue();
  };

  const handleCreate = () => {
    setCurrentRow(null);
    drawer.onTrue();
  };

  const pageCount = Math.ceil(totalItems / PER_PAGE);

  return (
    <>
      {/* Toolbar */}
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={2}
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <TextField
          size="small"
          placeholder={t('detail.team.toolbar.search')}
          value={currentFilters.search}
          onChange={(e) => { updateFilters({ search: e.target.value }); setPage(1); }}
          InputProps={{
            startAdornment: <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled', mr: 0.5 }} />,
          }}
          sx={{ flex: '1 1 200px' }}
        />

        <Autocomplete
          size="small"
          options={statusOptions}
          getOptionLabel={(o) => o.name}
          getOptionKey={(o) => o.id}
          value={statusOptions.find((o) => o.id === currentFilters.statusId) ?? null}
          onChange={(_e, val) => { updateFilters({ statusId: val?.id ?? '' }); setPage(1); }}
          renderInput={(params) => <TextField {...params} label={t('detail.team.toolbar.status')} />}
          sx={{ flex: '1 1 160px' }}
        />

        <Autocomplete
          size="small"
          options={workerOptions}
          getOptionLabel={(o) => o.fullName}
          getOptionKey={(o) => o.id}
          value={workerOptions.find((o) => o.id === currentFilters.employeeId) ?? null}
          onChange={(_e, val) => { updateFilters({ employeeId: val?.id ?? '' }); setPage(1); }}
          onInputChange={(_e, value, reason) => { if (reason === 'input') loadWorkerOptions(value || undefined); }}
          renderInput={(params) => <TextField {...params} label={t('detail.team.toolbar.employee')} />}
          sx={{ flex: '1 1 200px' }}
        />

        {canManageTeam && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleCreate}
            sx={{ flexShrink: 0, ml: 'auto' }}
          >
            {t('detail.team.assign')}
          </Button>
        )}
      </Stack>

      {/* Grid */}
      {!loading && assignments.length === 0 ? (
        <EmptyContent title={t('detail.team.empty')} sx={{ py: 10 }} />
      ) : (
        <Grid container spacing={3}>
          {assignments.map((assignment) => (
            <Grid key={assignment.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <AssignmentCard
                assignment={assignment}
                onEdit={() => handleEdit(assignment)}
                onUnassign={() => handleDelete(assignment.id)}
                readOnly={!canManageTeam}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_e, p) => setPage(p)}
            color="primary"
          />
        </Box>
      )}

      <AssignmentCreateEditDrawer
        open={drawer.value}
        projectId={projectId}
        currentRow={currentRow}
        onClose={drawer.onFalse}
        onSuccess={fetchAssignments}
      />
    </>
  );
}
