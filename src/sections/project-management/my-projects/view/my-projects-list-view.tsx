'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IMyProject } from 'src/types/project-management';

import { useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetMyProjectsService } from 'src/services/project-management/my-projects.service';

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

// ----------------------------------------------------------------------

type ViewMode = 'grid' | 'list';

type Filters = {
  search: string;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

// ----------------------------------------------------------------------

export function MyProjectsListView() {
  const { t } = useTranslate('project-management');
  const router = useRouter();
  const table = useTable();

  const [projects, setProjects] = useState<IMyProject[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [filters, setFilters] = useState<Filters>({ search: '' });
  const debouncedSearch = useDebounce(filters.search, 300);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: 'name', label: t('projects.table.columns.name') },
      { id: 'status', label: t('projects.table.columns.status'), width: 140 },
      { id: 'importance', label: t('projects.table.columns.importance'), width: 130 },
      { id: 'dedication', label: t('detail.summary.fields.dedication'), width: 120 },
      { id: 'dates', label: t('projects.table.columns.dates'), width: 200 },
      { id: '', width: 80 },
    ],
    [t]
  );

  const updateFilter = useCallback(
    (name: keyof Filters, value: string) => {
      table.onResetPage();
      setFilters((prev) => ({ ...prev, [name]: value }));
    },
    [table]
  );

  const loadProjects = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
      };
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await GetMyProjectsService(params as any);
      setProjects(response.data?.data ?? []);
      setTotalItems(response.data?.meta?.itemCount ?? 0);
    } catch {
      toast.error(t('myProjects.messages.errorLoading'));
      setProjects([]);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, t]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleViewDetail = (id: number) =>
    router.push(paths.dashboard.projectManagement.myProjectDetail(String(id)));

  const notFound = !projects.length;

  const renderToolbar = () => (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ sm: 'center' }}
      justifyContent="space-between"
      sx={{ p: 2.5, gap: 2 }}
    >
      <TextField
        sx={{ flex: '1 1 200px' }}
        value={filters.search}
        onChange={(e) => updateFilter('search', e.target.value)}
        placeholder={t('projects.table.toolbar.search')}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
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
  );

  const renderGrid = notFound ? (
    <EmptyContent filled title={t('myProjects.empty.title')} sx={{ py: 10, m: 3 }} />
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
      {projects.map((project) => (
        <MyProjectCard
          key={project.id}
          project={project}
          onViewDetail={() => handleViewDetail(project.id)}
        />
      ))}
    </Box>
  );

  const renderList = (
    <Scrollbar>
      <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
        <TableHeadCustom headCells={TABLE_HEAD} />
        <TableBody>
          {projects.map((project) => (
            <MyProjectTableRow
              key={project.id}
              project={project}
              onViewDetail={() => handleViewDetail(project.id)}
            />
          ))}
          <TableEmptyRows
            height={table.dense ? 56 : 76}
            emptyRows={emptyRows(0, table.rowsPerPage, projects.length)}
          />
          <TableNoData notFound={notFound} />
        </TableBody>
      </Table>
    </Scrollbar>
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('myProjects.title')}
        links={[
          { name: t('myProjects.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('myProjects.breadcrumbs.projectManagement') },
          { name: t('myProjects.breadcrumbs.myProjects') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        {renderToolbar()}

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
  );
}

// ----------------------------------------------------------------------

type CardProps = {
  project: IMyProject;
  onViewDetail: () => void;
};

function MyProjectCard({ project, onViewDetail }: CardProps) {
  const { t } = useTranslate('project-management');

  return (
    <Card
      onClick={onViewDetail}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': { boxShadow: (theme) => theme.customShadows?.z8 ?? theme.shadows[4] },
        transition: 'box-shadow 0.2s',
      }}
    >
      <Stack sx={{ flex: 1, p: 2.5, gap: 2 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Avatar sx={{ width: 44, height: 44, flexShrink: 0 }}>
            {getInitials(project.name)}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap title={project.name}>
              {project.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {project.code}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip label={project.statusName} size="small" variant="soft" color="info" />
          <Chip label={project.assignmentStatusName} size="small" variant="soft" color="success" />
        </Stack>

        {project.roles.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {project.roles.slice(0, 2).map((role) => (
              <Chip
                key={role}
                label={role}
                size="small"
                variant="outlined"
                sx={{ fontSize: 11, height: 22 }}
              />
            ))}
            {project.roles.length > 2 && (
              <Chip
                label={`+${project.roles.length - 2}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: 11, height: 22 }}
              />
            )}
          </Stack>
        )}

        <Stack spacing={0.6}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:calendar-date-bold" width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {fDate(project.startDate)} — {fDate(project.endDate)}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:chart-2-bold-duotone" width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('myProjects.card.dedication')}: <strong>{project.dedicacion}%</strong>
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:notes-bold-duotone" width={14} sx={{ color: 'text.disabled', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {project.activityCount} {t('myProjects.card.activities')}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

type TableRowProps = {
  project: IMyProject;
  onViewDetail: () => void;
};

function MyProjectTableRow({ project, onViewDetail }: TableRowProps) {

  return (
    <TableRow hover>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            sx={{ width: 36, height: 36, fontSize: 12, flexShrink: 0 }}
          >
            {getInitials(project.name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {project.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {project.code}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Chip label={project.statusName} size="small" variant="soft" color="info" />
      </TableCell>

      <TableCell>
        <Typography variant="body2">{project.importanceLevelName}</Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2">{project.dedicacion}%</Typography>
      </TableCell>

      <TableCell>
        <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
          {fDate(project.startDate)} — {fDate(project.endDate)}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <IconButton size="small" onClick={onViewDetail}>
          <Iconify icon="solar:forward-bold" width={18} />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
