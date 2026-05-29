'use client';

import type { IEvaluationData } from 'src/types/performance';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
	SaveEvaluationResponseService,
	GetEvaluationByEvaluatorService,
} from 'src/services/performance/evaluation-responses.service';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EvaluationResponseObjectivesCanva } from '../evaluation-response-objectives-canva';

// ----------------------------------------------------------------------

type Props = {
	assignmentId: string;
};

export function EvaluationResponseObjectives({ assignmentId }: Props) {
	const { t } = useTranslate('performance');

	const [evaluationData, setEvaluationData] = useState<IEvaluationData | null>(null);
	const [loading, setLoading] = useState(true);

	// Cargar datos iniciales de la evaluación
	useEffect(() => {
		const loadEvaluationData = async () => {
			try {
				setLoading(true);
				const response = await GetEvaluationByEvaluatorService(assignmentId);
				if (response.data) {
					setEvaluationData(response.data.data);
				}
			} catch (error) {
				console.error('Error loading evaluation data:', error);
				toast.error(t('evaluation-responses.messages.error.loading'));
			} finally {
				setLoading(false);
			}
		};

		if (assignmentId) {
			loadEvaluationData();
		}
	}, [assignmentId, t]);

	// Guardar respuesta de objetivo
	const handleSaveAnswer = async (answer: {
		objectiveId: number;
		scaleLevelId?: number;
		achievedValue?: number;
		comments?: string;
	}) => {
		try {
			const payload = {
				evaluatorAssignmentId: Number(assignmentId),
				answers: [answer],
			};
			await SaveEvaluationResponseService(payload);
			toast.success(t('evaluation-responses.objectives.messages.answerSaved'));

			// Recargar datos de la evaluación para actualizar el progreso
			const response = await GetEvaluationByEvaluatorService(assignmentId);
			if (response.data) {
				setEvaluationData(response.data.data);
			}
		} catch (error) {
			console.error('Error saving answer:', error);
			toast.error(t('evaluation-responses.messages.error.savingAnswer'));
			throw error;
		}
	};

	return (
		<DashboardContent>
			<CustomBreadcrumbs
				heading={t('evaluation-responses.objectives.title')}
				links={[
					{ name: t('evaluation-responses.breadcrumbs.dashboard'), href: paths.dashboard.root },
					{ name: t('evaluation-responses.breadcrumbs.evaluationResponses'), href: paths.dashboard.performance.evaluationResponses },
					{ name: t('evaluation-responses.objectives.breadcrumb') },
				]}
				sx={{ mb: { xs: 3, md: 5 } }}
			/>

			<EvaluationResponseObjectivesCanva
				evaluationData={evaluationData}
				loading={loading}
				onSaveAnswer={handleSaveAnswer}
				assignmentId={String(assignmentId)}
			/>
		</DashboardContent>
	);
}
