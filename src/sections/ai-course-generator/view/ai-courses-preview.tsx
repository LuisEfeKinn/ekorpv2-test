'use client';

// ----------------------------------------------------------------------
// AI Courses Preview View
// ----------------------------------------------------------------------

import type { IAiCourse } from 'src/types/ai-course';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
	GetAiCourseByIdService,
} from 'src/services/ai/SaveOrUpdateAiCourseGeneration.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiCoursePreviewRender } from '../ai-course-preview-render';

// ----------------------------------------------------------------------

type Props = {
	id: string;
};

export function AiCoursesPreviewView({ id }: Props) {
	const { t } = useTranslate('ai-course');
	const router = useRouter();

	const [course, setCourse] = useState<IAiCourse | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Load course data
	const loadCourse = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await GetAiCourseByIdService(id);
			setCourse(response?.data?.data);
		} catch (error) {
			console.error('Error loading course:', error);
			toast.error(t('messages.error.loading'));
			router.push(paths.dashboard.ai.courseGenerator.root);
		} finally {
			setIsLoading(false);
		}
	}, [id, router, t]);

	useEffect(() => {
		loadCourse();
	}, [loadCourse]);

	if (isLoading) {
		return (
			<DashboardContent>
				<CustomBreadcrumbs
					heading={t('preview.title')}
					links={[
						{ name: t('breadcrumbs.dashboard'), href: paths.dashboard.root },
						{ name: t('title'), href: paths.dashboard.ai.courseGenerator.root },
						{ name: t('preview.title') },
					]}
					sx={{ mb: { xs: 3, md: 5 } }}
				/>

				<Stack spacing={3}>
					<Card sx={{ p: 3 }}>
						<Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 3 }} />
						<Skeleton variant="text" width={300} height={48} />
						<Skeleton variant="text" height={24} />
						<Skeleton variant="text" height={24} />
						<Stack direction="row" spacing={1} sx={{ mt: 2 }}>
							<Skeleton variant="rounded" width={80} height={24} />
							<Skeleton variant="rounded" width={80} height={24} />
							<Skeleton variant="rounded" width={80} height={24} />
						</Stack>
					</Card>

					<Card sx={{ p: 3 }}>
						<Skeleton variant="text" width={200} height={32} />
						<Stack spacing={1} sx={{ mt: 2 }}>
							<Skeleton variant="text" height={24} />
							<Skeleton variant="text" height={24} />
							<Skeleton variant="text" height={24} />
						</Stack>
					</Card>
				</Stack>
			</DashboardContent>
		);
	}

	return (
		<DashboardContent maxWidth="lg">
			<CustomBreadcrumbs
				heading={course?.title || t('preview.title')}
				links={[
					{ name: t('breadcrumbs.dashboard'), href: paths.dashboard.root },
					{ name: t('title'), href: paths.dashboard.ai.courseGenerator.root },
					{ name: course?.title || t('preview.title') },
				]}
				action={
					<Button
						variant="outlined"
						color="inherit"
						onClick={() => router.push(paths.dashboard.ai.courseGenerator.edit(id))}
						startIcon={<Iconify icon="solar:pen-bold" />}
					>
						{t('actions.edit')}
					</Button>
				}
				sx={{ mb: { xs: 3, md: 5 } }}
			/>

			{course && <AiCoursePreviewRender course={course} />}
		</DashboardContent>
	);
}
