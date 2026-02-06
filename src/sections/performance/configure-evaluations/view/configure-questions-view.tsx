'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IQuestion, IQuestionTableFilters } from 'src/types/performance';

import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteQuestionsService,
  GetQuestionsPaginationService,
} from 'src/services/performance/questions.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { AddQuestionModal } from '../add-question-modal';
import { EditQuestionModal } from '../edit-question-modal';
import { ConfigureQuestionsTableRow } from '../configure-questions-table-row';
import { ConfigureQuestionsTableToolbar } from '../configure-questions-table-toolbar';
import { ConfigureQuestionsTableFiltersResult } from '../configure-questions-table-filters-result';

// ----------------------------------------------------------------------

type Props = {
  campaignId: string;
  competenceId: string;
};

export function ConfigureQuestionsView({ campaignId, competenceId }: Props) {
  const { t } = useTranslate('performance');
  const table = useTable();

  const [tableData, setTableData] = useState<IQuestion[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | undefined>(undefined);
  const [selectedQuestion, setSelectedQuestion] = useState<IQuestion | null>(null);

  const filters = useSetState<IQuestionTableFilters>({
    search: '',
  });

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const canReset = !!filters.state.search;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const fetchData = useCallback(async () => {
    try {
      const params: any = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
      };

      if (filters.state.search) {
        params.search = filters.state.search;
      }

      const response = await GetQuestionsPaginationService(competenceId, campaignId, params);
      const questionsData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
      setTableData(questionsData);
    } catch (error: any) {
      console.error('Error loading questions:', error);
      toast.error(t(error?.message) || t('questions.messages.error.loading'));
    }
  }, [table.page, table.rowsPerPage, filters.state.search, competenceId, campaignId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteQuestionsService(id);
        toast.success(t('questions.messages.success.deleted'));
        fetchData();
      } catch (error) {
        console.error('Error deleting question:', error);
        toast.error(t('questions.messages.error.deleting'));
      }
    },
    [fetchData, t]
  );

  const handleEditRow = useCallback(
    (id: string) => {
      const question = tableData.find((q) => q.id === id);
      if (question) {
        setSelectedQuestion(question);
        setOpenEditModal(true);
      }
    },
    [tableData]
  );

  const handleAddQuestion = useCallback(() => {
    setSelectedQuestionId(undefined);
    setOpenModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpenModal(false);
    setSelectedQuestionId(undefined);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setOpenEditModal(false);
    setSelectedQuestion(null);
  }, []);

  const handleSuccess = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: '', label: '' },
    { id: 'description', label: t('questions.table.columns.description') },
    { id: 'weight', label: t('questions.table.columns.weight'), align: 'center' },
    { id: 'isOptional', label: t('questions.table.columns.isOptional'), align: 'center' },
    { id: 'scale', label: t('questions.table.columns.scale') },
    { id: 'visibleFor', label: t('questions.table.columns.visibleFor') },
  ];

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('questions.title')}
          links={[
            {
              name: t('questions.breadcrumbs.dashboard'),
              href: paths.dashboard.root,
            },
            {
              name: t('questions.breadcrumbs.configureEvaluations'),
              href: paths.dashboard.performance.configureEvaluations,
            },
            {
              name: t('questions.breadcrumbs.edit'),
              href: paths.dashboard.performance.configureEvaluationsEdit(campaignId),
            },
            {
              name: t('questions.breadcrumbs.questions'),
            },
          ]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleAddQuestion}
            >
              {t('questions.actions.create')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <ConfigureQuestionsTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
          />

          {canReset && (
            <ConfigureQuestionsTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
              />

              <TableBody>
                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <ConfigureQuestionsTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      onEditRow={() => handleEditRow(row.id)}
                    />
                  ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 76}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />

                <TableNoData
                  notFound={notFound}
                  sx={{ textAlign: 'center' }}
                />
              </TableBody>
            </Table>
          </Scrollbar>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      <AddQuestionModal
        open={openModal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        competenceId={competenceId}
        campaignId={campaignId}
        questionId={selectedQuestionId}
      />

      <EditQuestionModal
        open={openEditModal}
        onClose={handleCloseEditModal}
        onSuccess={handleSuccess}
        question={selectedQuestion}
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IQuestion[];
  comparator: (a: any, b: any) => number;
  filters: IQuestionTableFilters;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { search } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (search) {
    inputData = inputData.filter((question) =>
      question.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  return inputData;
}
