'use client';

import type { IEvaluationData, IEvaluationForm } from 'src/types/performance';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { 
  GetEvaluationByEvaluatorService,
  GetQuestionsByCompetenceService 
} from 'src/services/performance/evaluation-responses.service';

import { toast } from 'src/components/snackbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EvaluationResponsesPreviewForm } from '../evaluation-responses-preview-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function EvaluationByEvaluatorView({ id }: Props) {
  const { t } = useTranslate('performance');
  const [evaluationData, setEvaluationData] = useState<IEvaluationData | IEvaluationForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        setLoading(true);
        
        // Obtener datos base de la evaluación
        const response = await GetEvaluationByEvaluatorService(id);
        if (!response?.data?.data) {
          toast.error(t('evaluation-responses.messages.error.loading'));
          return;
        }

        const baseData = response.data.data;
        
        // Cargar preguntas para cada competencia
        const competencesWithQuestions = await Promise.all(
          (baseData.sections.competences || []).map(async (competence: any) => {
            try {
              const questionsResponse = await GetQuestionsByCompetenceService(
                id, 
                competence.competenceId
              );
              
              if (questionsResponse?.data?.data) {
                // Transformar las respuestas al formato esperado
                const questions = questionsResponse.data.data.questions.map((q: any) => ({
                  questionId: q.questionId,
                  text: q.text,
                  description: q.description,
                  weight: q.weight,
                  isOptional: q.isOptional,
                  scale: q.scale,
                  currentAnswer: q.currentAnswer
                }));

                return {
                  ...competence,
                  questions
                };
              }
              
              return competence;
            } catch (error) {
              console.error(`Error loading questions for competence ${competence.competenceId}:`, error);
              return competence;
            }
          })
        );

        // Construir estructura tipo IEvaluationForm con preguntas y respuestas
        const responses: any[] = [];
        competencesWithQuestions.forEach((comp: any) => {
          if (comp.questions) {
            comp.questions.forEach((q: any) => {
              if (q.currentAnswer) {
                // Encontrar el nivel de escala correspondiente
                const scaleLevel = q.scale.levels.find(
                  (level: any) => level.id === q.currentAnswer.scaleLevelId
                );
                
                if (scaleLevel) {
                  responses.push({
                    id: q.currentAnswer.id,
                    questionId: q.questionId,
                    scaleLevel: {
                      value: scaleLevel.value,
                      label: scaleLevel.label
                    },
                    comments: q.currentAnswer.comments,
                    isAnonymous: false
                  });
                }
              }
            });
          }
        });

        // Crear estructura compatible con IEvaluationForm
        const enrichedData: IEvaluationForm = {
          participant: baseData.participant,
          evaluator: baseData.evaluator,
          campaign: baseData.campaign,
          competences: competencesWithQuestions,
          objectives: baseData.sections.objectives || [],
          responses
        };

        setEvaluationData(enrichedData);
      } catch (err) {
        console.error('Error fetching evaluation:', err);
        toast.error(t('evaluation-responses.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvaluation();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!evaluationData) {
    return null;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={evaluationData.campaign.name}
        links={[
          { name: t('evaluation-responses.breadcrumbs.dashboard'), href: paths.dashboard.root },
          {
            name: t('evaluation-responses.breadcrumbs.evaluationResponses'),
            href: paths.dashboard.performance.evaluationResponses
          },
          { name: `${t('evaluation-responses.breadcrumbs.evaluation')} ${evaluationData.campaign.name || ''}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EvaluationResponsesPreviewForm evaluationData={evaluationData} />
    </DashboardContent>
  );
}