import type { IEvaluationData, IEvaluationForm, IEvaluationFormResponse } from 'src/types/performance';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Radio from '@mui/material/Radio';
import Table from '@mui/material/Table';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = {
  evaluationData: IEvaluationData | IEvaluationForm;
};

export function EvaluationResponsesPreviewForm({ evaluationData }: Props) {
  const { t } = useTranslate('performance');

  // Verificar si es IEvaluationForm (con preguntas) o IEvaluationData (solo resumen)
  const isDetailedEvaluation = 'responses' in evaluationData;

  const { participant, evaluator, campaign } = evaluationData;

  // Adaptar según el tipo de datos
  const progress = 'progress' in evaluationData ? evaluationData.progress : undefined;
  const sections = 'sections' in evaluationData ? evaluationData.sections : undefined;
  const competences = isDetailedEvaluation ? (evaluationData as any).competences : sections?.competences || [];
  const objectives = isDetailedEvaluation ? (evaluationData as any).objectives : sections?.objectives || [];
  const responses = isDetailedEvaluation ? (evaluationData as any).responses : [];

  // Helper function to find response for a question
  const getResponseForQuestion = (questionId: string): IEvaluationFormResponse | undefined =>
    responses.find((r: any) => r.questionId === questionId);

  // Calculate progress for detailed evaluation
  const totalQuestions = isDetailedEvaluation
    ? competences.reduce((sum: number, comp: any) => sum + (comp.questions?.length || 0), 0) +
    objectives.reduce((sum: number, obj: any) => sum + (obj.questions?.length || 0), 0)
    : progress?.totalQuestions || 0;

  const answeredQuestions = isDetailedEvaluation ? responses.length : progress?.answeredQuestions || 0;

  const relationshipLabels: { [key: string]: string } = {
    MANAGER: t('evaluation-responses.relationships.MANAGER'),
    PEER: t('evaluation-responses.relationships.PEER'),
    SUBORDINATE: t('evaluation-responses.relationships.SUBORDINATE'),
    SELF: t('evaluation-responses.relationships.SELF'),
    OTHER: t('evaluation-responses.relationships.OTHER'),
  };

  return (
    <Card>
      {/* Header Section */}
      <Box sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>
          {t(`configure-evaluations.types.${campaign.type}`)} • {t('evaluation-responses.preview.confidential')}
        </Typography>
        <Divider sx={{
          mt: 2,
          bgcolor: 'text.secondary',
        }} />
      </Box>

      {/* Participant and Evaluator Info */}
      <Box sx={{ p: 3 }}>
        <Box display="grid" gap={3} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }}>
          {/* Section I: Datos del Evaluado */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              I. {t('evaluation-responses.preview.participantData')}
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: '40%', border: '1px solid', borderColor: 'divider' }}>
                    {t('evaluation-responses.preview.fullName')}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid', borderColor: 'divider' }}>
                    {participant.fullName}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          {/* Section II: Datos del Evaluador */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              II. {t('evaluation-responses.preview.evaluatorData')}
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: '40%', border: '1px solid', borderColor: 'divider' }}>
                    {t('evaluation-responses.preview.evaluator')}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid', borderColor: 'divider' }}>
                    {evaluator.fullName}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: '1px solid', borderColor: 'divider' }}>
                    {t('evaluation-responses.preview.relationshipWithParticipant')}
                  </TableCell>
                  <TableCell sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Chip
                      label={relationshipLabels[evaluator.relationship] || evaluator.relationship}
                      size="small"
                      color="primary"
                      variant="soft"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>

        {/* Status Badge */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Label
            variant="soft"
            color={evaluator.completed ? 'success' : 'warning'}
            sx={{ px: 2, py: 1 }}
          >
            {evaluator.completed
              ? t('evaluation-responses.preview.completedYes')
              : t('evaluation-responses.preview.completedNo')}
          </Label>
          <Typography variant="body2" color="text.secondary">
            {answeredQuestions} / {totalQuestions} {t('evaluation-responses.preview.questionsAnswered')}
          </Typography>
        </Box>
      </Box>

      {/* Competences Section */}
      {competences && competences.length > 0 && (
        <Box sx={{ px: 3, pb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
            III. {t('evaluation-responses.preview.competencesIndicators')}
          </Typography>

          {competences.map((competence: any, compIndex: number) => (
            <Box key={competence.competenceId} sx={{ mb: 3 }}>
              {/* Competence Header */}
              <Box sx={{ p: 1.5, mb: 0, border: '2px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {compIndex + 1}. {competence.name}
                  <Chip
                    label={`${(competence.weight * 100).toFixed(0)}%`}
                    size="small"
                    sx={{ ml: 1, fontWeight: 600 }}
                  />
                </Typography>
              </Box>

              {/* Mostrar tabla de preguntas si existen (IEvaluationForm) */}
              {competence.questions && competence.questions.length > 0 ? (
                <TableContainer sx={{ border: '2px solid', borderTop: 'none', borderColor: 'divider' }}>
                  <Table size="small" sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.200' }}>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            border: '2px solid',
                            borderColor: 'divider',
                            width: '30%',
                            py: 1.5
                          }}
                        >
                          {t('evaluation-responses.preview.question')}
                        </TableCell>
                        <TableCell
                          align="center"
                          colSpan={competence.questions[0]?.scale?.levels?.length || 5}
                          sx={{
                            fontWeight: 700,
                            border: '2px solid',
                            borderColor: 'divider',
                            py: 1.5
                          }}
                        >
                          {t('evaluation-responses.preview.rating')}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            border: '2px solid',
                            borderColor: 'divider',
                            width: '30%',
                            py: 1.5
                          }}
                        >
                          {t('evaluation-responses.preview.comments')}
                        </TableCell>
                      </TableRow>
                      {/* Sub-header for scale levels */}
                      {(competence.questions[0]?.scale?.levels?.length || 0) > 0 && (
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                          <TableCell sx={{ border: '2px solid', borderColor: 'divider', py: 0 }} />
                          {competence.questions[0].scale.levels.map((level: any) => (
                            <TableCell
                              key={level.value}
                              align="center"
                              sx={{
                                border: '2px solid',
                                borderColor: 'divider',
                                py: 1,
                                px: 0.5,
                                minWidth: 70
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                {level.value}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.65rem',
                                  lineHeight: 1.2,
                                  display: 'block'
                                }}
                              >
                                {level.label}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      )}
                    </TableHead>
                    <TableBody>
                      {competence.questions.map((question: any, qIndex: number) => {
                        const response = getResponseForQuestion(question.questionId);
                        const scaleLevels = question.scale.levels || [];

                        return (
                          <TableRow key={question.questionId} hover>
                            {/* Question Column */}
                            <TableCell sx={{ border: '2px solid', borderColor: 'divider', py: 2, px: 2 }}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>{compIndex + 1}.{qIndex + 1}</strong> {question.text}
                              </Typography>
                              {question.isOptional && (
                                <Chip
                                  label={t('evaluation-responses.preview.optional')}
                                  size="small"
                                  sx={{ mt: 0.5, height: 18, fontSize: '0.7rem' }}
                                />
                              )}
                            </TableCell>

                            {/* Scale Levels Columns */}
                            {scaleLevels.length > 0 ? (
                              <>
                                {scaleLevels.map((level: any) => {
                                  const isSelected = response?.scaleLevel.value === level.value;
                                  return (
                                    <TableCell
                                      key={level.value}
                                      align="center"
                                      sx={{
                                        border: '2px solid',
                                        borderColor: 'divider',
                                        bgcolor: isSelected ? 'success.lighter' : 'transparent',
                                        px: 1,
                                        py: 2,
                                        minWidth: 70
                                      }}
                                    >
                                      <Radio
                                        checked={isSelected}
                                        disabled
                                        size="small"
                                        sx={{ p: 0 }}
                                      />
                                    </TableCell>
                                  );
                                })}
                              </>
                            ) : (
                              <TableCell
                                align="center"
                                colSpan={5}
                                sx={{
                                  border: '2px solid',
                                  borderColor: 'divider',
                                  bgcolor: response ? 'success.lighter' : 'grey.100',
                                  py: 2
                                }}
                              >
                                {response ? (
                                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                    <Box
                                      sx={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        bgcolor: 'success.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />
                                    </Box>
                                    <Typography variant="body2" fontWeight={600}>
                                      {response.scaleLevel.value} - {response.scaleLevel.label}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.disabled">-</Typography>
                                )}
                              </TableCell>
                            )}

                            {/* Comments Column */}
                            <TableCell sx={{ border: '2px solid', borderColor: 'divider', py: 2, px: 2 }}>
                              {response?.comments ? (
                                <Typography variant="body2">{response.comments}</Typography>
                              ) : (
                                <Typography variant="body2" color="text.disabled" fontStyle="italic">
                                  -
                                </Typography>
                              )}
                              {response?.isAnonymous && (
                                <Chip
                                  label={t('evaluation-responses.preview.anonymous')}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{ mt: 1, height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                /* Mostrar resumen si no hay preguntas (IEvaluationData) */
                <Box sx={{ p: 2, border: '2px solid', borderTop: 'none', borderColor: 'divider' }}>
                  {competence.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {competence.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('evaluation-responses.preview.questionsAnswered')}: {competence.answeredCount} / {competence.questionsCount}
                    </Typography>
                    <Chip
                      label={`${Math.round((competence.answeredCount / competence.questionsCount) * 100)}% ${t('evaluation-responses.history.completed')}`}
                      size="small"
                      color={competence.answeredCount === competence.questionsCount ? 'success' : 'warning'}
                      variant="soft"
                    />
                  </Box>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Objectives Section */}
      {objectives && objectives.length > 0 && (
        <Box sx={{ px: 3, pb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
            IV. {t('evaluation-responses.preview.objectivesIndicators')}
          </Typography>

          {objectives.map((objective: any, objIndex: number) => (
            <Box key={objective.objectiveId} sx={{ mb: 3 }}>
              {/* Objective Header */}
              <Box sx={{ bgcolor: 'success.lighter', p: 1.5, mb: 0, border: '2px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {objIndex + 1}. {objective.name}
                  <Chip
                    label={`${(objective.weight * 100).toFixed(0)}%`}
                    size="small"
                    color="success"
                    sx={{ ml: 1, fontWeight: 600 }}
                  />
                </Typography>
              </Box>

              {/* Mostrar tabla de preguntas si existen (IEvaluationForm) */}
              {objective.questions && objective.questions.length > 0 ? (
                <TableContainer sx={{ border: '2px solid', borderTop: 'none', borderColor: 'divider' }}>
                  <Table size="small" sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.200' }}>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            border: '2px solid',
                            borderColor: 'divider',
                            width: '30%',
                            py: 1.5
                          }}
                        >
                          {t('evaluation-responses.preview.question')}
                        </TableCell>
                        <TableCell
                          align="center"
                          colSpan={objective.questions[0]?.scale?.levels?.length || 5}
                          sx={{
                            fontWeight: 700,
                            border: '2px solid',
                            borderColor: 'divider',
                            py: 1.5
                          }}
                        >
                          {t('evaluation-responses.preview.rating')}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            border: '2px solid',
                            borderColor: 'divider',
                            width: '30%',
                            py: 1.5
                          }}
                        >
                          {t('evaluation-responses.preview.comments')}
                        </TableCell>
                      </TableRow>
                      {/* Sub-header for scale levels */}
                      {(objective.questions[0]?.scale?.levels?.length || 0) > 0 && (
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                          <TableCell sx={{ border: '2px solid', borderColor: 'divider', py: 0 }} />
                          {objective.questions[0].scale.levels.map((level: any) => (
                            <TableCell
                              key={level.value}
                              align="center"
                              sx={{
                                border: '2px solid',
                                borderColor: 'divider',
                                py: 1,
                                px: 0.5,
                                minWidth: 70
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                {level.value}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.65rem',
                                  lineHeight: 1.2,
                                  display: 'block'
                                }}
                              >
                                {level.label}
                              </Typography>
                            </TableCell>
                          ))}
                          <TableCell sx={{ border: '2px solid', borderColor: 'divider', py: 0 }} />
                        </TableRow>
                      )}
                    </TableHead>
                    <TableBody>
                      {objective.questions.map((question: any, qIndex: number) => {
                        const response = getResponseForQuestion(question.questionId);
                        const scaleLevels = question.scale.levels || [];

                        return (
                          <TableRow key={question.questionId} hover>
                            {/* Question Column */}
                            <TableCell sx={{ border: '2px solid', borderColor: 'divider', py: 2, px: 2 }}>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>{objIndex + 1}.{qIndex + 1}</strong> {question.text}
                              </Typography>
                              {question.isOptional && (
                                <Chip
                                  label={t('evaluation-responses.preview.optional')}
                                  size="small"
                                  sx={{ mt: 0.5, height: 18, fontSize: '0.7rem' }}
                                />
                              )}
                            </TableCell>

                            {/* Scale Levels Columns */}
                            {scaleLevels.length > 0 ? (
                              <>
                                {scaleLevels.map((level: any) => {
                                  const isSelected = response?.scaleLevel.value === level.value;
                                  return (
                                    <TableCell
                                      key={level.value}
                                      align="center"
                                      sx={{
                                        border: '2px solid',
                                        borderColor: 'divider',
                                        bgcolor: isSelected ? 'success.lighter' : 'transparent',
                                        px: 1,
                                        py: 2,
                                        minWidth: 70
                                      }}
                                    >
                                      <Radio
                                        checked={isSelected}
                                        disabled
                                        size="small"
                                        sx={{ p: 0 }}
                                      />
                                    </TableCell>
                                  );
                                })}
                              </>
                            ) : (
                              <TableCell
                                align="center"
                                colSpan={5}
                                sx={{
                                  border: '2px solid',
                                  borderColor: 'divider',
                                  bgcolor: response ? 'success.lighter' : 'grey.100',
                                  py: 2
                                }}
                              >
                                {response ? (
                                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                    <Box
                                      sx={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        bgcolor: 'success.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />
                                    </Box>
                                    <Typography variant="body2" fontWeight={600}>
                                      {response.scaleLevel.value} - {response.scaleLevel.label}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.disabled">-</Typography>
                                )}
                              </TableCell>
                            )}

                            {/* Comments Column */}
                            <TableCell sx={{ border: '2px solid', borderColor: 'divider', py: 2, px: 2 }}>
                              {response?.comments ? (
                                <Typography variant="body2">{response.comments}</Typography>
                              ) : (
                                <Typography variant="body2" color="text.disabled" fontStyle="italic">
                                  -
                                </Typography>
                              )}
                              {response?.isAnonymous && (
                                <Chip
                                  label={t('evaluation-responses.preview.anonymous')}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{ mt: 1, height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                /* Mostrar KPIs si no hay preguntas (IEvaluationData) */
                <Box sx={{ bgcolor: 'success.lighter', p: 2, border: '2px solid', borderTop: 'none', borderColor: 'divider' }}>
                  <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {t('evaluation-responses.preview.targetValue')}
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {objective.targetValue?.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {t('evaluation-responses.preview.customKpi')}
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {objective.customKpi}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Card>
  );
}
