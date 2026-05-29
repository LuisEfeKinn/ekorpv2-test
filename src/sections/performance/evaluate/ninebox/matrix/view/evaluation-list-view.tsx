'use client';

import type {
	IConfigureEvaluation,
	IConfigureEvaluationTableFilters,
} from 'src/types/performance';

import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
	CancelEvaluationCampaignService,
	DeleteConfigureEvaluationService,
	GetConfigureEvaluationsPaginationService,
} from 'src/services/performance/configure-evaluations.service';

import { toast } from 'src/components/snackbar';
import { EmptyContent } from 'src/components/empty-content';
import { TablePaginationCustom } from 'src/components/table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EvaluationCard } from '../evaluation-card';
import { EvaluationsListTableToolbar } from '../evaluations-list-table-toolbar';
import { EvaluationsListTableFiltersResult } from '../evaluations-list-table-filters-result';

// ----------------------------------------------------------------------

export function EvaluationsListView() {
	const { t } = useTranslate('performance');
	const router = useRouter();

	const [tableData, setTableData] = useState<IConfigureEvaluation[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [totalCount, setTotalCount] = useState(0);

	const filters = useSetState<IConfigureEvaluationTableFilters>({
		name: '',
		type: '',
		status: '',
		departmentIds: '',
		positionIds: '',
		employeeIds: '',
	});

	const canReset =
		!!filters.state.name ||
		!!filters.state.type ||
		!!filters.state.status ||
		filters.state.departmentIds.length > 0 ||
		filters.state.positionIds.length > 0 ||
		filters.state.employeeIds.length > 0;

	const notFound = !tableData.length && !loading;

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const params: any = { page: page + 1, perPage: rowsPerPage };
			if (filters.state.name) params.search = filters.state.name;
			if (filters.state.type) params.type = filters.state.type;
			if (filters.state.status) params.status = filters.state.status;
			if (filters.state.departmentIds) params.departmentIds = filters.state.departmentIds;
			if (filters.state.positionIds) params.positionIds = filters.state.positionIds;
			if (filters.state.employeeIds) params.employeeIds = filters.state.employeeIds;
			const response = await GetConfigureEvaluationsPaginationService(params);
			setTableData(response.data.data || []);
			setTotalCount(response.data.meta?.itemCount || 0);
		} catch (error) {
			console.error('Error loading evaluations:', error);
			toast.error(t('nine-box.messages.error.loading'));
		} finally {
			setLoading(false);
		}
	}, [page, rowsPerPage, filters.state, t]);

	const handleDeleteRow = useCallback(
		async (id: string) => {
			try {
				const response = await DeleteConfigureEvaluationService(id);
				if (response.data.statusCode === 200) {
					toast.success(t('nine-box.messages.success.deleted'));
					fetchData();
				}
			} catch (error: unknown) {
				const err = error as { message?: string };
				toast.error(err?.message || t('nine-box.messages.error.deleting'));
			}
		},
		[fetchData, t]
	);

	const handleCancelRow = useCallback(
		async (id: string) => {
			try {
				const response = await CancelEvaluationCampaignService(id);
				toast.success(response?.data?.message || t('nine-box.messages.success.cancelled'));
				fetchData();
			} catch (error: unknown) {
				const err = error as { response?: { data?: { message?: string } } };
				toast.error(err?.response?.data?.message || t('nine-box.messages.error.cancelling'));
			}
		},
		[fetchData, t]
	);

	const handleChangePage = useCallback((event: unknown, newPage: number) => {
		setPage(newPage);
	}, []);

	const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	}, []);

	const handleEditRow = useCallback(
		(id: string) => {
			router.push(paths.dashboard.performance.configureEvaluationsEdit(id));
		},
		[router]
	);

	const handleViewRow = useCallback(
		(id: string) => {
			router.push(`${paths.dashboard.performance.nineBoxMatrix(id)}`);
		},
		[router]
	);

	const handleViewHistory = useCallback(
		(id: string) => {
			router.push(paths.dashboard.performance.nineBoxHistory(id));
		},
		[router]
	);

	useEffect(() => {
		fetchData();
		 
	}, [fetchData]);

	const handleResetPage = useCallback(() => {
		setPage(0);
	}, []);

	return (
		<DashboardContent>
			<CustomBreadcrumbs
				heading={t('nine-box.title')}
				links={[
					{
						name: t('nine-box.breadcrumbs.dashboard'),
						href: paths.dashboard.root,
					},
					{
						name: t('nine-box.breadcrumbs.evaluate'),
					},
					{
						name: t('nine-box.title'),
					},
				]}
				sx={{ mb: { xs: 3, md: 5 } }}
			/>

			<Stack spacing={3}>
				<Card>
					<EvaluationsListTableToolbar
						filters={filters}
						onResetPage={handleResetPage}
					/>

					{canReset && (
						<EvaluationsListTableFiltersResult
							filters={filters}
							totalResults={totalCount}
							onResetPage={handleResetPage}
							sx={{ p: 2.5, pt: 0 }}
						/>
					)}
				</Card>

				{loading ? (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							minHeight: 400,
						}}
					>
						<CircularProgress size={60} />
					</Box>
				) : (
					<>
						{notFound ? (
							<EmptyContent
								filled
								title={t('nine-box.table.empty.title')}
								description={t('nine-box.table.empty.description')}
								sx={{
									py: 10,
									borderRadius: 2,
									bgcolor: 'background.paper',
								}}
							/>
						) : (
							<Grid container spacing={3}>
								{tableData.map((evaluation) => (
									<Grid key={evaluation.id} size={{ xs: 12, sm: 6, md: 4 }}>
										<EvaluationCard
											evaluation={evaluation}
											onView={() => handleViewRow(evaluation.id)}
											onEdit={() => handleEditRow(evaluation.id)}
											onDelete={() => handleDeleteRow(evaluation.id)}
											onCloseCampaign={() => handleCancelRow(evaluation.id)}
											onViewHistory={() => handleViewHistory(evaluation.id)}
										/>
									</Grid>
								))}
							</Grid>
						)}

						{!notFound && (
							<Card sx={{ mt: 3 }}>
								<TablePaginationCustom
									page={page}
									count={totalCount}
									rowsPerPage={rowsPerPage}
									onPageChange={handleChangePage}
									onRowsPerPageChange={handleChangeRowsPerPage}
								/>
							</Card>
						)}
					</>
				)}
			</Stack>
		</DashboardContent>
	);
}

