'use client';

import type { IMyResults } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetMyResultsByCampaignService } from 'src/services/performance/evaluation-responses.service';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EvaluationResponsesMyResults } from '../evaluation-responses-my-results';

// ----------------------------------------------------------------------

type Props = {
	campaingId: string;
};

export function EvaluationMyResultsView({ campaingId }: Props) {
	const { t } = useTranslate('performance');

	const [loading, setLoading] = useState<boolean>(true);
	const [myResults, setMyResults] = useState<IMyResults | null>(null);

	const fetchMyResults = useCallback(async () => {
		try {
			setLoading(true);
			const response = await GetMyResultsByCampaignService(campaingId);
			setMyResults(response.data);
		} catch (error: any) {
			toast.error(t(error?.message) || t('evaluation-responses.messages.error.loadingMyResults'));
			console.error('Error fetching my results:', error);
			setMyResults(null);
		} finally {
			setLoading(false);
		}
	}, [campaingId, t]);

	useEffect(() => {
		fetchMyResults();
	}, [fetchMyResults]);

	return (
		<DashboardContent>
			<CustomBreadcrumbs
				heading={t('evaluation-responses.myResults.title')}
				links={[
					{ name: t('evaluation-responses.breadcrumbs.dashboard'), href: paths.dashboard.root },
					{
						name: t('evaluation-responses.breadcrumbs.myEvaluations'),
						href: paths.dashboard.performance.evaluationResponses,
					},
					{ name: t('evaluation-responses.myResults.title') },
				]}
				sx={{ mb: { xs: 3, md: 5 } }}
			/>

			<EvaluationResponsesMyResults loading={loading} myResults={myResults} />
		</DashboardContent>
	);
}
