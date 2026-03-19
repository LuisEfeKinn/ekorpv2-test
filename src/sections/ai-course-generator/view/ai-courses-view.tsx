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
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
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
	const { t } = useTranslate('ai');
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
		order: '',
	});
	const { state: currentFilters, setState: updateFilters } = filters;

	const STATUS_OPTIONS = useMemo(
		() => [
			{ value: 'all', label: t('ai-course-generation.filters.all'), showCount: true },
			{ value: 'draft', label: t('ai-course-generation.status.draft'), showCount: false },
			{ value: 'published', label: t('ai-course-generation.status.published'), showCount: false },
		],
		[t]
	);

	const DIFFICULTY_OPTIONS = useMemo(
		() => [
			{ value: 'all', label: t('ai-course-generation.filters.allDifficulties') },
			{ value: 'beginner', label: t('ai-course-generation.difficulty.beginner') },
			{ value: 'intermediate', label: t('ai-course-generation.difficulty.intermediate') },
		],
		[t]
	);

	const ORDER_OPTIONS = useMemo(
		() => [
			{ value: '', label: t('ai-course-generation.filters.orderDefault') },
			{ value: 'unit.title:asc', label: t('ai-course-generation.order.titleAsc') },
			{ value: 'unit.title:desc', label: t('ai-course-generation.order.titleDesc') },
			{ value: 'unit.difficulty:asc', label: t('ai-course-generation.order.difficultyAsc') },
			{ value: 'unit.difficulty:desc', label: t('ai-course-generation.order.difficultyDesc') },
			{ value: 'unit.status:asc', label: t('ai-course-generation.order.statusAsc') },
			{ value: 'unit.status:desc', label: t('ai-course-generation.order.statusDesc') },
		],
		[t]
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
				order: currentFilters.order || undefined,
			};

			const response = await GetAiCoursesPaginationService(params as any);

			setCourses(response?.data?.data || []);
			setTotalItems(response?.data?.meta?.itemCount || 0);
		} catch (error) {
			console.error('Error loading AI courses:', error);
			toast.error(t('ai-course-generation.messages.error.loading'));
			setCourses([]);
			setTotalItems(0);
		}
	}, [table.page, table.rowsPerPage, currentFilters, t]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const canReset = !!currentFilters.name || currentFilters.status !== 'all' || currentFilters.difficulty !== 'all' || !!currentFilters.order;
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
				toast.success(t('ai-course-generation.messages.success.deleted'));
				loadData();
			}
		} catch (error) {
			console.error('Error deleting course:', error);
			toast.error(t('ai-course-generation.messages.error.deleting'));
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
		updateFilters({ name: '', status: 'all', difficulty: 'all', order: '' });
	}, [updateFilters, table]);

	return (
		<>
			<DashboardContent>
				<CustomBreadcrumbs
					heading={t('ai-course-generation.title')}
					links={[
						{ name: t('ai-course-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
						{ name: t('ai-course-generation.title') },
					]}
					action={
						<Button
							component={RouterLink}
							href={paths.dashboard.ai.courseGenerator.create}
							variant="contained"
							startIcon={<Iconify icon="tabler:robot" />}
						>
							{t('ai-course-generation.actions.generateWithAi')}
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
									tab.showCount ? (
										<Label
											variant={
												(tab.value === 'all' || tab.value === currentFilters.status) ? 'filled' : 'soft'
											}
											color="default"
										>
											{totalItems}
										</Label>
									) : undefined
								}
							/>
						))}
					</Tabs>

					{/* Search & Filters */}
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 2.5 }}>
					<TextField
						fullWidth
						value={currentFilters.name}
						onChange={(e) => {
							table.onResetPage();
							updateFilters({ name: e.target.value });
						}}
						placeholder={t('ai-course-generation.search.placeholder')}
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

					<FormControl sx={{ minWidth: 160 }}>
						<InputLabel>{t('ai-course-generation.filters.difficulty')}</InputLabel>
						<Select
							value={currentFilters.difficulty}
							label={t('ai-course-generation.filters.difficulty')}
							onChange={(e) => {
								table.onResetPage();
								updateFilters({ difficulty: e.target.value });
							}}
						>
							{DIFFICULTY_OPTIONS.map((opt) => (
								<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl sx={{ minWidth: 190 }}>
						<InputLabel>{t('ai-course-generation.filters.orderBy')}</InputLabel>
						<Select
							value={currentFilters.order}
							label={t('ai-course-generation.filters.orderBy')}
							onChange={(e) => {
								table.onResetPage();
								updateFilters({ order: e.target.value });
							}}
						>
							{ORDER_OPTIONS.map((opt) => (
								<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
							))}
						</Select>
					</FormControl>
				</Stack>
					{/* Content */}
					<Box sx={{ p: 2.5, pt: 0 }}>
						{notFound ? (
							<EmptyContent
								filled
								title={canReset ? t('ai-course-generation.noResults') : t('ai-course-generation.noData')}
								description={canReset ? t('ai-course-generation.noResultsHint') : t('ai-course-generation.noDataHint')}
								action={
									canReset ? (
										<Button
											onClick={handleResetFilters}
											startIcon={<Iconify icon="solar:restart-bold" />}
										>
											{t('ai-course-generation.actions.clearFilters')}
										</Button>
									) : (
										<Button
											component={RouterLink}
											href={paths.dashboard.ai.courseGenerator.create}
											variant="contained"
											startIcon={<Iconify icon="tabler:robot" />}
										>
											{t('ai-course-generation.actions.generateWithAi')}
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
				title={t('ai-course-generation.dialogs.delete.title')}
				content={t('ai-course-generation.dialogs.delete.content')}
				action={
					<Button variant="contained" color="error" onClick={handleConfirmDelete}>
						{t('ai-course-generation.actions.delete')}
					</Button>
				}
			/>
		</>
	);
}
