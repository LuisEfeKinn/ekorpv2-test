'use client';

import type { IEvaluationDetailCompetence } from 'src/types/performance';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { useTranslate } from 'src/locales';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = {
  competence: IEvaluationDetailCompetence;
};

export function EvaluationDetailCompetenceCard({ competence }: Props) {
  const { t } = useTranslate('performance');
  const theme = useTheme();

  // Gráfico de barras comparativo (Esperado vs Obtenido)
  const barChartOptions = useChart({
    chart: {
      type: 'bar',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: true,
    },
    xaxis: {
      categories: [t('evaluation-detail.chart.expected'), t('evaluation-detail.chart.obtained')],
    },
    yaxis: {
      title: {
        text: t('evaluation-detail.competencies.compliance'),
      },
    },
    colors: [theme.palette.info.main, theme.palette.success.main],
    legend: {
      show: false,
    },
  });

  const barChartSeries = [
    {
      name: competence.competenceName,
      data: [competence.expectedLevel, competence.obtainedLevel],
    },
  ];

  // Gráfico de desglose por rol
  const roleChartOptions = useChart({
    chart: {
      type: 'radar',
      toolbar: { show: false },
    },
    xaxis: {
      categories: competence.breakdownByRole.map((role) => {
        const translationKey = `evaluation-detail.relationships.${role.relationship}`;
        return t(translationKey);
      }),
    },
    yaxis: {
      show: true,
    },
    colors: [theme.palette.primary.main],
  });

  const roleChartSeries = [
    {
      name: t('evaluation-detail.chart.score'),
      data: competence.breakdownByRole.map((role) => role.score),
    },
  ];

  const getGapColor = (gap: number) => {
    if (gap <= 0) return 'success';
    if (gap <= 20) return 'warning';
    return 'error';
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: competence.color || theme.palette.primary.main,
                }}
              />
              <Typography variant="h6">{competence.competenceName}</Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {t('evaluation-detail.competencies.answered')}: {competence.answeredQuestions} /{' '}
              {competence.totalQuestions}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" color="primary">
              {competence.compliancePercentage.toFixed(0)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('evaluation-detail.competencies.compliance')}
            </Typography>
          </Box>
        </Stack>

        <Divider />

        {/* Métricas */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('evaluation-detail.competencies.expected')}
            </Typography>
            <Typography variant="h6" color="info.main">
              {competence.expectedLevel.toFixed(1)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('evaluation-detail.competencies.obtained')}
            </Typography>
            <Typography variant="h6" color="success.main">
              {competence.obtainedLevel.toFixed(1)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('evaluation-detail.competencies.gap')}
            </Typography>
            <Typography variant="h6" color={`${getGapColor(competence.gap)}.main`}>
              {competence.gap > 0 ? '+' : ''}
              {competence.gap.toFixed(1)}
            </Typography>
          </Box>
        </Stack>

        {/* Progreso de completitud */}
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('evaluation-detail.competencies.completion')}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {competence.completionPercentage.toFixed(0)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={competence.completionPercentage}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        <Divider />

        {/* Gráficos */}
        <Stack
          spacing={3}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
            },
            gap: 3,
          }}
        >
          {/* Gráfico de barras */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {t('evaluation-detail.chart.expectedVsObtained')}
            </Typography>
            <Chart
              type="bar"
              series={barChartSeries}
              options={barChartOptions}
              sx={{ height: 240 }}
            />
          </Box>

          {/* Gráfico radar */}
          {competence.breakdownByRole.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                {t('evaluation-detail.competencies.breakdownByRole')}
              </Typography>
              <Chart
                type="radar"
                series={roleChartSeries}
                options={roleChartOptions}
                sx={{ height: 240 }}
              />
            </Box>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
