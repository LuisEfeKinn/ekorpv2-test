'use client';

import type { TableHeadCellProps } from 'src/components/table';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
	DeleteNineBoxSettingsService,
	GetNineBoxSettingsPaginationService
} from 'src/services/performance/ninebox-settings.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
	useTable,
	emptyRows,
	TableNoData,
	getComparator,
	TableEmptyRows,
	TableHeadCustom,
	TableSelectedAction,
	TablePaginationCustom,
} from 'src/components/table';

import { SettingsNineBoxTableRow } from '../settings-ninebox-table-row';
import { SettingsNineBoxTableModal } from '../settings-ninebox-table-modal';
import { SettingsNineBoxTableToolbar } from '../settings-ninebox-table-toolbar';
import { SettingsNineBoxTableFiltersResult } from '../settings-ninebox-table-filters-result';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function SettingsNineboxView() {
	const { t } = useTranslate('performance');
	const table = useTable();
	const confirmDialog = useBoolean();
	const modalDialog = useBoolean();

	const [tableData, setTableData] = useState<any[]>([]);
	const [totalItems, setTotalItems] = useState(0);
	const [selectedRow, setSelectedRow] = useState<any>(null);

	const STATUS_OPTIONS = useMemo(() => [
		{ value: 'all', label: t('nine-box-settings.filters.all') },
	], [t]);

	const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
		{ id: '', width: 88 },
		{ id: 'label', label: t('nine-box-settings.columns.label') },
		{ id: 'color', label: t('nine-box-settings.columns.color') },
		{ id: 'description', label: t('nine-box-settings.columns.description') },
		{ id: 'recommendedAction', label: t('nine-box-settings.columns.recommendedAction') },
		{ id: 'minScoreX', label: t('nine-box-settings.columns.minScoreX') },
		{ id: 'maxScoreX', label: t('nine-box-settings.columns.maxScoreX') },
	], [t]);

	const filters = useSetState<any>({
		name: '',
		color: '',
		status: 'all',
	});
	const { state: currentFilters, setState: updateFilters } = filters;


	// Función para cargar datos
	const loadData = useCallback(async () => {
		try {
			const params = {
				page: table.page + 1,
				perPage: table.rowsPerPage,
				search: currentFilters.name,
			};

			const response = await GetNineBoxSettingsPaginationService(params);
			// Verificar la estructura de la respuesta
			const data = response.data[0] || response.data?.data || response.data || [];

			setTableData(Array.isArray(data) ? data : []);
			setTotalItems(response.data?.totalItems || data.length || 0);
		} catch (error) {
			console.error('Error loading data:', error);
			toast.error(t('nine-box-settings.messages.error.loading'));
			setTableData([]);
			setTotalItems(0);
		}
	}, [table.page, table.rowsPerPage, currentFilters.name, t]);

	// Cargar datos cuando cambian los parámetros
	useEffect(() => {
		loadData();
	}, [loadData]);

	// Aplicar filtros
	const dataFiltered = applyFilter({
		inputData: Array.isArray(tableData) ? tableData : [],
		comparator: getComparator(table.order, table.orderBy),
		filters: currentFilters,
	});

	const canReset = !!currentFilters.name || (currentFilters.status !== 'all' && currentFilters.status !== undefined);
	const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

	const handleDeleteRow = useCallback(
		async (id: string) => {
			try {
				const response = await DeleteNineBoxSettingsService(id);

				if (response.data.statusCode === 200) {
					toast.success(t('nine-box-settings.messages.success.deleted'));
					loadData(); // Recargar datos
				}
			} catch (error) {
				console.error('Error deleting data:', error);
				toast.error(t('nine-box-settings.messages.error.deleting'));
			}
		},
		[loadData, t]
	);

	const handleDeleteRows = useCallback(async () => {
		try {
			// Eliminar múltiples elementos
			const deletePromises = table.selected.map(id => DeleteNineBoxSettingsService(id));
			await Promise.all(deletePromises);

			toast.success(t('nine-box-settings.messages.success.deletedMultiple'));
			table.setSelected([]);
			loadData(); // Recargar datos
		} catch (error) {
			console.error('Error deleting data:', error);
			toast.error(t('nine-box-settings.messages.error.deletingMultiple'));
		}
	}, [table, loadData, t]);

	const handleFilterStatus = useCallback(
		(event: React.SyntheticEvent, newValue: string) => {
			table.onResetPage();
			updateFilters({ status: newValue });
		},
		[updateFilters, table]
	);

	const handleResetFilters = useCallback(() => {
		table.onResetPage();
		updateFilters({ name: '', status: 'all' });
	}, [updateFilters, table]);

	const handleOpenModal = useCallback((row?: any) => {
		setSelectedRow(row || null);
		modalDialog.onTrue();
	}, [modalDialog]);

	const handleCloseModal = useCallback(() => {
		setSelectedRow(null);
		modalDialog.onFalse();
	}, [modalDialog]);

	const handleSaveModal = useCallback(() => {
		loadData(); // Recargar la tabla después de guardar
	}, [loadData]);

	const renderConfirmDialog = () => (
		<ConfirmDialog
			open={confirmDialog.value}
			onClose={confirmDialog.onFalse}
			title={t('nine-box-settings.dialogs.delete.title')}
			content={
				<>
					{t('nine-box-settings.dialogs.delete.contentMultiple', { count: table.selected.length })}
				</>
			}
			action={
				<Button
					variant="contained"
					color="error"
					onClick={() => {
						handleDeleteRows();
						confirmDialog.onFalse();
					}}
				>
					Delete
				</Button>
			}
		/>
	);

	return (
		<>
			<DashboardContent>
				<CustomBreadcrumbs
					heading={t('nine-box-settings.title')}
					links={[
						{ name: t('nine-box-settings.breadcrumbs.dashboard'), href: paths.dashboard.root },
						{ name: t('nine-box-settings.breadcrumbs.nineBox') },
						{ name: t('nine-box-settings.breadcrumbs.settings') },
					]}
					// action={
					// 	<Button
					// 		onClick={() => handleOpenModal()}
					// 		variant="contained"
					// 		startIcon={<Iconify icon="mingcute:add-line" />}
					// 	>
					// 		{t('nine-box-settings.actions.add')}
					// 	</Button>
					// }
					sx={{ mb: { xs: 3, md: 5 } }}
				/>

				<Card>
					<Tabs
						value={currentFilters.status}
						onChange={handleFilterStatus}
						sx={[
							(theme) => ({
								px: { md: 2.5 },
								boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
							}),
						]}
					>
						{STATUS_OPTIONS.map((tab) => (
							<Tab
								key={tab.value}
								iconPosition="end"
								value={tab.value}
								label={tab.label}
								icon={
									<Label
										variant={
											((tab.value === 'all' || tab.value === currentFilters.status) && 'filled') ||
											'soft'
										}
										color="default"
									>
										{totalItems}
									</Label>
								}
							/>
						))}
					</Tabs>

					<SettingsNineBoxTableToolbar
						filters={currentFilters}
						onFilters={(name, value) => {
							table.onResetPage();
							updateFilters({ [name]: value });
						}}
					/>

					{canReset && (
						<SettingsNineBoxTableFiltersResult
							filters={currentFilters}
							totalResults={totalItems}
							onFilters={(name, value) => {
								updateFilters({ [name]: value });
							}}
							onReset={handleResetFilters}
							sx={{ p: 2.5, pt: 0 }}
						/>
					)}

					<Box sx={{ position: 'relative' }}>
						<TableSelectedAction
							dense={table.dense}
							numSelected={table.selected.length}
							rowCount={dataFiltered.length}
							onSelectAllRows={(checked) =>
								table.onSelectAllRows(
									checked,
									dataFiltered.map((row) => row.boxNumber)
								)
							}
							action={
								<IconButton color="primary" onClick={confirmDialog.onTrue}>
									<Iconify icon="solar:trash-bin-trash-bold" />
								</IconButton>
							}
						/>

						<Scrollbar>
							<Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
								<TableHeadCustom
									order={table.order}
									orderBy={table.orderBy}
									headCells={TABLE_HEAD}
									rowCount={dataFiltered.length}
									numSelected={table.selected.length}
									onSort={table.onSort}
								// onSelectAllRows={(checked) =>
								//   table.onSelectAllRows(
								//     checked,
								//     dataFiltered.map((row) => row.id)
								//   )
								// }
								/>

								<TableBody>
									{dataFiltered
										.slice(
											table.page * table.rowsPerPage,
											table.page * table.rowsPerPage + table.rowsPerPage
										)
										.map((row) => (
											<SettingsNineBoxTableRow
									key={row.boxNumber}
									row={row}
									mapHref={paths.dashboard.architecture.dataTableMap(row.boxNumber)}
									selected={table.selected.includes(row.boxNumber)}
									onSelectRow={() => table.onSelectRow(row.boxNumber)}
									onDeleteRow={() => handleDeleteRow(row.boxNumber)}
									onEditRow={() => handleOpenModal(row)}
								/>
									))}

								<TableEmptyRows
										height={table.dense ? 56 : 76}
										emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
									/>

									<TableNoData notFound={notFound} />
								</TableBody>
							</Table>
						</Scrollbar>
					</Box>

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

			{renderConfirmDialog()}

			<SettingsNineBoxTableModal
				row={selectedRow}
				open={modalDialog.value}
				onClose={handleCloseModal}
				onSave={handleSaveModal}
			/>
		</>
	);
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
	inputData: any[];
	filters: any;
	comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
	// Asegurar que inputData es un array válido
	if (!Array.isArray(inputData)) {
		console.warn('applyFilter: inputData is not an array, returning empty array');
		return [];
	}

	const { name, status } = filters;

	const stabilizedThis = inputData.map((el, index) => [el, index] as const);

	stabilizedThis.sort((a, b) => {
		const order = comparator(a[0], b[0]);
		if (order !== 0) return order;
		return a[1] - b[1];
	});

	inputData = stabilizedThis.map((el) => el[0]);

	if (name) {
		inputData = inputData.filter(
			(item) => item?.label?.toLowerCase().indexOf(name.toLowerCase()) !== -1
		);
	}

	if (status !== 'all') {
		// TODO: Implement status filtering when the data model includes a status field
	}

	return inputData;
};