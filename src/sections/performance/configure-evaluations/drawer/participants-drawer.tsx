'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { ICampaignParticipant, ICampaignParticipantTableFilters } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { fDateTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { GetParticipantsByEvaluationCampaingsIdService } from 'src/services/performance/configure-evaluations.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { ParticipantsTableToolbar } from '../participants-table-toolbar';
import { ParticipantsTableFiltersResult } from '../participants-table-filters-result';
import { ParticipantEvaluatorDetailDrawer } from './participant-evaluator-detail-drawer';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
};

type SelectedParticipant = {
  id: string;
  name: string;
};

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  COMPLETED: 'success',
  IN_PROGRESS: 'info',
  PENDING: 'warning',
  CANCELLED: 'error',
};

// ----------------------------------------------------------------------

export function ParticipantsDrawer({ open, onClose, campaignId, campaignName }: Props) {
  const { t } = useTranslate('performance');
  const theme = useTheme();
  const table = useTable();
  const evaluatorDetailOpen = useBoolean();

  const [tableData, setTableData] = useState<ICampaignParticipant[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedParticipant, setSelectedParticipant] = useState<SelectedParticipant | null>(null);

  const filters = useSetState<ICampaignParticipantTableFilters>({
    search: '',
    status: '',
  });

  const canReset = !!filters.state.search || !!filters.state.status;
  const notFound = totalCount === 0;

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: '', label: '', width: 56 },
    { id: 'employeeName', label: t('campaign-participants.table.columns.employeeName') },
    { id: 'status', label: t('campaign-participants.table.columns.status') },
    { id: 'createdAt', label: t('campaign-participants.table.columns.createdAt') },
  ];

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
      };
      if (filters.state.search) params.search = filters.state.search;
      if (filters.state.status) params.status = filters.state.status;

      const response = await GetParticipantsByEvaluationCampaingsIdService(campaignId, params);
      const data = response.data?.data || [];
      const meta = response.data?.meta;
      setTableData(data);
      setTotalCount(meta?.itemCount || data.length);
    } catch (error) {
      console.error('Error loading participants:', error);
      toast.error(t('campaign-participants.messages.error.loading'));
    }
  }, [campaignId, table.page, table.rowsPerPage, filters.state.search, filters.state.status, t]);

  useEffect(() => {
    if (open) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, table.page, table.rowsPerPage, filters.state.search, filters.state.status]);

  const handleViewEvaluators = (participant: ICampaignParticipant) => {
    setSelectedParticipant({
      id: participant.id,
      name: participant.employee?.fullName || '-',
    });
    evaluatorDetailOpen.onTrue();
  };

  const handleClose = () => {
    // Reset state on close
    filters.setState({ search: '', status: '' });
    table.onResetPage();
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 720, md: 860 },
            display: 'flex',
            flexDirection: 'column',
            zIndex: (th) => th.zIndex.drawer + 1,
          },
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
            flexShrink: 0,
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            <Iconify icon="solar:users-group-rounded-bold" width={22} />
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {t('campaign-participants.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {campaignName}
            </Typography>
          </Box>

          <IconButton onClick={handleClose} edge="end">
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Box>

        {/* ── Body ── */}
        <Box sx={{ flex: 1, overflowY: 'auto', pb: 3 }}>
          {/* Toolbar */}
          <ParticipantsTableToolbar filters={filters} onResetPage={table.onResetPage} />

          {canReset && (
            <ParticipantsTableFiltersResult
              filters={filters}
              totalResults={totalCount}
              onResetPage={table.onResetPage}
              sx={{ px: 2.5, pb: 2, pt: 0 }}
            />
          )}

          {/* Table — tamaño natural al contenido */}
          <Card
            sx={{
              mx: 2.5,
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
              boxShadow: 'none',
              overflow: 'hidden',
            }}
          >
              <Scrollbar>
                <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 600 }}>
                  <TableHeadCustom
                    order={table.order}
                    orderBy={table.orderBy}
                    headCells={TABLE_HEAD}
                    rowCount={tableData.length}
                    onSort={table.onSort}
                  />

                  <TableBody>
                    {tableData.map((row) => (
                      <TableRow key={row.id} hover>
                        {/* Eye button */}
                        <TableCell sx={{ px: 1 }}>
                          <Tooltip title={t('campaign-participants.actions.viewEvaluators')}>
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => handleViewEvaluators(row)}
                            >
                              <Iconify icon="solar:eye-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>

                        {/* Employee name */}
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: 13,
                                fontWeight: 700,
                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                color: 'primary.main',
                                flexShrink: 0,
                              }}
                            >
                              {(row.employee?.fullName || '-').charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>
                              {row.employee?.fullName || '-'}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Label
                            variant="soft"
                            color={STATUS_COLOR[row.status] ?? 'default'}
                          >
                            {t(`campaign-participants.statuses.${row.status}`)}
                          </Label>
                        </TableCell>

                        {/* Created at */}
                        <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                          <Typography variant="caption">
                            {row.createdAt ? fDateTime(row.createdAt) : '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}

                    <TableEmptyRows
                      height={table.dense ? 56 : 76}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, totalCount)}
                    />

                    <TableNoData notFound={notFound} sx={{ textAlign: 'center' }} />
                  </TableBody>
                </Table>
              </Scrollbar>

              <TablePaginationCustom
                page={table.page}
                dense={table.dense}
                count={totalCount}
                rowsPerPage={table.rowsPerPage}
                onPageChange={table.onChangePage}
                onChangeDense={table.onChangeDense}
                onRowsPerPageChange={table.onChangeRowsPerPage}
                sx={{ borderTop: `1px solid ${alpha(theme.palette.grey[500], 0.12)}` }}
              />
          </Card>
        </Box>
      </Drawer>

      {/* ── Nested: evaluator detail drawer ── */}
      {selectedParticipant && (
        <ParticipantEvaluatorDetailDrawer
          open={evaluatorDetailOpen.value}
          onClose={evaluatorDetailOpen.onFalse}
          campaignId={campaignId}
          participantId={selectedParticipant.id}
          assignmentId={selectedParticipant.id}
          participantName={selectedParticipant.name}
        />
      )}
    </>
  );
}
