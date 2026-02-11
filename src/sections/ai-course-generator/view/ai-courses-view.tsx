'use client';

// ----------------------------------------------------------------------
// AI Courses View - Main listing view
// ----------------------------------------------------------------------

import type { IAiCourse, IAiCourseTableFilters } from 'src/types/ai-course';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
	DeleteAiCourseService,
	GetAiCoursesPaginationService,
} from 'src/services/ai/SaveOrUpdateAiCourseGeneration.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TablePaginationCustom } from 'src/components/table';

import { AiCourseCard } from '../ai-course-card';

// ----------------------------------------------------------------------

export function AiCoursesView() {
	const { t } = useTranslate('ai-course');
	const router = useRouter();
	const table = useTable({ defaultRowsPerPage: 12 });
	const confirmDialog = useBoolean();

	const [courses, setCourses] = useState<IAiCourse[]>([]);
	const [totalItems, setTotalItems] = useState(0);
	const [itemToDelete, setItemToDelete] = useState<string | null>(null);

	const filters = useSetState<IAiCourseTableFilters>({
		name: '',
		status: 'all',
		difficulty: 'all',
	});
	const { state: currentFilters, setState: updateFilters } = filters;

	// Status counts
	const statusCounts = useMemo(() => {
		const draft = courses.filter((c) => c.status === 'draft').length;
		const generating = courses.filter((c) => c.status === 'generating').length;
		const completed = courses.filter((c) => c.status === 'completed').length;
		const published = courses.filter((c) => c.status === 'published').length;
		const archived = courses.filter((c) => c.status === 'archived').length;

		return { all: courses.length, draft, generating, completed, published, archived };
	}, [courses]);

	const STATUS_OPTIONS = useMemo(
		() => [
			{ value: 'all', label: t('filters.all'), count: statusCounts.all },
			{ value: 'draft', label: t('status.draft'), count: statusCounts.draft },
			{ value: 'generating', label: t('status.generating'), count: statusCounts.generating },
			{ value: 'completed', label: t('status.completed'), count: statusCounts.completed },
			{ value: 'published', label: t('status.published'), count: statusCounts.published },
			{ value: 'archived', label: t('status.archived'), count: statusCounts.archived },
		],
		[t, statusCounts]
	);

	// Load data
	const loadData = useCallback(async () => {
		try {
			const params = {
				page: table.page + 1,
				perPage: table.rowsPerPage,
				search: currentFilters.name || undefined,
				status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
				difficulty: currentFilters.difficulty !== 'all' ? currentFilters.difficulty : undefined,
			};

			const response = await GetAiCoursesPaginationService(params as any);

			setCourses(response?.data?.data || []);
			setTotalItems(response?.data?.meta?.itemCount || 0);
		} catch (error) {
			console.error('Error loading AI courses:', error);
			toast.error(t('messages.error.loading'));
			setCourses([]);
			setTotalItems(0);
		}
	}, [table.page, table.rowsPerPage, currentFilters, t]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const canReset = !!currentFilters.name || currentFilters.status !== 'all' || currentFilters.difficulty !== 'all';
	const notFound = !courses.length;

	// Handlers
	const handleView = useCallback(
		(id: string) => {
			router.push(paths.dashboard.ai.courseGenerator.view(id));
		},
		[router]
	);

	const handleEdit = useCallback(
		(id: string) => {
			router.push(paths.dashboard.ai.courseGenerator.edit(id));
		},
		[router]
	);

	const handleOpenDeleteDialog = useCallback(
		(id: string) => {
			setItemToDelete(id);
			confirmDialog.onTrue();
		},
		[confirmDialog]
	);

	const handleConfirmDelete = useCallback(async () => {
		if (!itemToDelete) return;

		try {
			const response = await DeleteAiCourseService(itemToDelete);

			if (response.data.statusCode === 200) {
				toast.success(t('messages.success.deleted'));
				loadData();
			}
		} catch (error) {
			console.error('Error deleting course:', error);
			toast.error(t('messages.error.deleting'));
		} finally {
			confirmDialog.onFalse();
			setItemToDelete(null);
		}
	}, [itemToDelete, loadData, t, confirmDialog]);

	const handleFilterStatus = useCallback(
		(event: React.SyntheticEvent, newValue: string) => {
			table.onResetPage();
			updateFilters({ status: newValue });
		},
		[updateFilters, table]
	);

	const handleResetFilters = useCallback(() => {
		table.onResetPage();
		updateFilters({ name: '', status: 'all', difficulty: 'all' });
	}, [updateFilters, table]);

	return (
		<>
			<DashboardContent>
				<CustomBreadcrumbs
					heading={t('title')}
					links={[
						{ name: t('breadcrumbs.dashboard'), href: paths.dashboard.root },
						{ name: t('title') },
					]}
					action={
						<Button
							component={RouterLink}
							href={paths.dashboard.ai.courseGenerator.create}
							variant="contained"
							startIcon={<Iconify icon="tabler:robot" />}
						>
							{t('actions.generateWithAi')}
						</Button>
					}
					sx={{ mb: { xs: 3, md: 5 } }}
				/>

				<Card>
					{/* Status Tabs */}
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
											(tab.value === 'all' || tab.value === currentFilters.status) ? 'filled' : 'soft'
										}
										color={
											tab.value === 'published'
												? 'success'
												: tab.value === 'generating'
													? 'info'
													: tab.value === 'completed'
														? 'primary'
														: 'default'
										}
									>
										{tab.count}
									</Label>
								}
							/>
						))}
					</Tabs>

					{/* Search & Filters */}
					<Box sx={{ p: 2.5 }}>
						<TextField
							fullWidth
							value={currentFilters.name}
							onChange={(e) => {
								table.onResetPage();
								updateFilters({ name: e.target.value });
							}}
							placeholder={t('search.placeholder')}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<Iconify icon="solar:eye-scan-bold" width={20} sx={{ color: 'text.disabled' }} />
									</InputAdornment>
								),
								endAdornment: currentFilters.name && (
									<InputAdornment position="end">
										<Iconify
											icon="solar:close-circle-bold"
											width={20}
											sx={{ cursor: 'pointer', color: 'text.disabled' }}
											onClick={() => updateFilters({ name: '' })}
										/>
									</InputAdornment>
								),
							}}
						/>
					</Box>

					{/* Content */}
					<Box sx={{ p: 2.5, pt: 0 }}>
						{notFound ? (
							<EmptyContent
								filled
								title={canReset ? t('noResults') : t('noData')}
								description={canReset ? t('noResultsHint') : t('noDataHint')}
								action={
									canReset ? (
										<Button
											onClick={handleResetFilters}
											startIcon={<Iconify icon="solar:restart-bold" />}
										>
											{t('actions.clearFilters')}
										</Button>
									) : (
										<Button
											component={RouterLink}
											href={paths.dashboard.ai.courseGenerator.create}
											variant="contained"
											startIcon={<Iconify icon="tabler:robot" />}
										>
											{t('actions.generateWithAi')}
										</Button>
									)
								}
								sx={{ py: 8 }}
							/>
						) : (
							<Grid container spacing={3}>
								{courses.map((course) => (
									<Grid key={course.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
										<AiCourseCard
											row={course}
											onView={() => handleView(course.id)}
											onEdit={() => handleEdit(course.id)}
											onDelete={() => handleOpenDeleteDialog(course.id)}
										/>
									</Grid>
								))}
							</Grid>
						)}
					</Box>

					{/* Pagination */}
					{!notFound && (
						<TablePaginationCustom
							page={table.page}
							dense={table.dense}
							count={totalItems}
							rowsPerPage={table.rowsPerPage}
							onPageChange={table.onChangePage}
							onChangeDense={table.onChangeDense}
							onRowsPerPageChange={table.onChangeRowsPerPage}
							rowsPerPageOptions={[12, 24, 48]}
						/>
					)}
				</Card>
			</DashboardContent>

			{/* Delete Confirmation Dialog */}
			<ConfirmDialog
				open={confirmDialog.value}
				onClose={confirmDialog.onFalse}
				title={t('dialogs.delete.title')}
				content={t('dialogs.delete.content')}
				action={
					<Button variant="contained" color="error" onClick={handleConfirmDelete}>
						{t('actions.delete')}
					</Button>
				}
			/>
		</>
	);
}
