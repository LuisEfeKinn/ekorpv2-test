'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IProject, IProjectTableFilters } from 'src/types/project-management';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState, useDebounce } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { DeleteProjectService, GetProjectsPaginationService } from 'src/services/project-management/project.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { ProjectsCard } from '../projects-card';
import { ProjectsToolbar } from '../projects-toolbar';
import { ProjectsTableRow } from '../projects-table-row';
import { ProjectsCreateEditDrawer } from '../projects-create-edit-drawer';

// ----------------------------------------------------------------------

type ViewMode = 'grid' | 'list';

// ----------------------------------------------------------------------

export function ProjectsView() {
  const { t } = useTranslate('project-management');
  const router = useRouter();
  const table = useTable();
  const createEditDrawer = useBoolean();

  const [tableData, setTableData] = useState<IProject[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentRow, setCurrentRow] = useState<IProject | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filters = useSetState<IProjectTableFilters>({
    search: '',
    statusId: '',
    clientId: '',
    importanceLevelId: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: '', width: 60 },
      { id: 'name', label: t('projects.table.columns.name') },
      { id: 'status', label: t('projects.table.columns.status'), width: 140 },
      { id: 'importance', label: t('projects.table.columns.importance'), width: 130 },
      { id: 'size', label: t('projects.table.columns.size'), width: 120 },
      { id: 'dates', label: t('projects.table.columns.dates'), width: 220 },
    ],
    [t]
  );

  const debouncedSearch = useDebounce(currentFilters.search, 300);

  const canReset =
    !!currentFilters.search ||
    !!currentFilters.statusId ||
    !!currentFilters.clientId ||
    !!currentFilters.importanceLevelId;

  const notFound = !tableData.length;

  const loadData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (currentFilters.statusId) params.statusId = Number(currentFilters.statusId);
      if (currentFilters.clientId) params.clientId = Number(currentFilters.clientId);
      if (currentFilters.importanceLevelId) params.importanceLevelId = Number(currentFilters.importanceLevelId);

      const response = await GetProjectsPaginationService(params as any);
      setTableData(response.data.data ?? []);
      setTotalItems(response.data.meta?.itemCount ?? 0);
    } catch {
      toast.error(t('projects.messages.errorLoading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, currentFilters.statusId, currentFilters.clientId, currentFilters.importanceLevelId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = useCallback(() => {
    setCurrentRow(null);
    createEditDrawer.onTrue();
  }, [createEditDrawer]);

  const handleOpenEdit = useCallback(
    (row: IProject) => {
      setCurrentRow(row);
      createEditDrawer.onTrue();
    },
    [createEditDrawer]
  );

  const handleViewDetail = useCallback(
    (id: string) => {
      router.push(paths.dashboard.projectManagement.projectDetail(id));
    },
    [router]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteProjectService(id);
        toast.success(t('projects.messages.deleted'));
        loadData();
      } catch {
        toast.error(t('projects.messages.errorDelete'));
      }
    },
    [loadData, t]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ search: '', statusId: '', clientId: '', importanceLevelId: '' });
  }, [updateFilters, table]);

  const renderGrid = notFound ? (
    <EmptyContent filled title={t('projects.empty.title')} sx={{ py: 10, m: 3 }} />
  ) : (
    <Box
      gap={3}
      display="grid"
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)',
      }}
      sx={{ p: 3 }}
    >
      {tableData.map((project) => (
        <ProjectsCard
          key={project.id}
          project={project}
          onEdit={() => handleOpenEdit(project)}
          onDelete={() => handleDeleteRow(project.id)}
          onViewDetail={() => handleViewDetail(project.id)}
        />
      ))}
    </Box>
  );

  const renderList = (
    <Scrollbar>
      <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
        <TableHeadCustom headCells={TABLE_HEAD} />
        <TableBody>
          {tableData.map((row) => (
            <ProjectsTableRow
              key={row.id}
              row={row}
              onEdit={() => handleOpenEdit(row)}
              onDelete={() => handleDeleteRow(row.id)}
              onViewDetail={() => handleViewDetail(row.id)}
            />
          ))}
          <TableEmptyRows
            height={table.dense ? 56 : 76}
            emptyRows={emptyRows(0, table.rowsPerPage, tableData.length)}
          />
          <TableNoData notFound={notFound} />
        </TableBody>
      </Table>
    </Scrollbar>
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('projects.title')}
          links={[
            { name: t('projects.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('projects.breadcrumbs.projectManagement') },
            { name: t('projects.breadcrumbs.projects') },
          ]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenCreate}
            >
              {t('projects.actions.new')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
            sx={{ p: 2.5, gap: 2 }}
          >
            <ProjectsToolbar
              filters={currentFilters}
              onFilters={(name, value) => {
                table.onResetPage();
                updateFilters({ [name]: value });
              }}
              onReset={handleResetFilters}
              canReset={canReset}
            />

            <ToggleButtonGroup
              exclusive
              value={viewMode}
              onChange={(_, newMode) => { if (newMode) setViewMode(newMode); }}
              size="small"
              sx={{ flexShrink: 0 }}
            >
              <ToggleButton value="grid">
                <Iconify icon="solar:widget-5-linear" />
              </ToggleButton>
              <ToggleButton value="list">
                <Iconify icon="solar:list-bold" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {viewMode === 'grid' ? renderGrid : renderList}

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={totalItems}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      <ProjectsCreateEditDrawer
        open={createEditDrawer.value}
        currentRow={currentRow}
        onClose={createEditDrawer.onFalse}
        onSuccess={loadData}
      />
    </>
  );
}
