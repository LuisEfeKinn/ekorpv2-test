'use client';

import type { IEvaluationData } from 'src/types/performance';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
    SaveEvaluationResponseService,
    GetEvaluationByEvaluatorService,
    GetQuestionsByCompetenceService,
} from 'src/services/performance/evaluation-responses.service';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EvaluationResponseHistoryCanva } from '../evaluation-response-history-canva';

// ----------------------------------------------------------------------

type Props = {
    assignmentId: string;
};


export function EvaluationResponseHistory({ assignmentId }: Props) {
    const { t } = useTranslate('performance');

    const [evaluationData, setEvaluationData] = useState<IEvaluationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCompetenceId, setSelectedCompetenceId] = useState<number | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

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

    // Cargar preguntas de una competencia específica
    const handleLoadCompetenceQuestions = async (competenceId: number) => {
        try {
            setLoadingQuestions(true);
            setSelectedCompetenceId(competenceId);
            const response = await GetQuestionsByCompetenceService(assignmentId, competenceId);
            if (response.data) {
                setQuestions(response.data.data.questions || []);
            }
        } catch (error) {
            console.error('Error loading questions:', error);
            toast.error(t('evaluation-responses.messages.error.loadingQuestions'));
            setQuestions([]);
        } finally {
            setLoadingQuestions(false);
        }
    };

    // Guardar respuesta
    const handleSaveAnswer = async (answer: {
        questionId: number;
        objectiveId?: number;
        customQuestion?: string;
        scaleLevelId?: number;
        comments?: string;
    }) => {
        try {
            const payload = {
                evaluatorAssignmentId: Number(assignmentId),
                answers: [answer],
            };
            await SaveEvaluationResponseService(payload);
            toast.success(t('evaluation-responses.messages.success.answerSaved'));

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
                heading={t('evaluation-responses.history.title')}
                links={[
                    { name: t('evaluation-responses.breadcrumbs.dashboard'), href: paths.dashboard.root },
                    { name: t('evaluation-responses.breadcrumbs.evaluationResponses'), href: paths.dashboard.performance.evaluationResponses },
                    { name: t('evaluation-responses.history.breadcrumb') },
                ]}
                sx={{ mb: { xs: 3, md: 5 } }}
            />

            <EvaluationResponseHistoryCanva
                evaluationData={evaluationData}
                loading={loading}
                questions={questions}
                loadingQuestions={loadingQuestions}
                selectedCompetenceId={selectedCompetenceId}
                onSelectCompetence={handleLoadCompetenceQuestions}
                onSaveAnswer={handleSaveAnswer}
                assignmentId={String(assignmentId)}
            />
        </DashboardContent>
    );
}
