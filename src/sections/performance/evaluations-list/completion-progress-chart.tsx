import type { IEvaluationDetail } from 'src/types/performance';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Chart, useChart } from 'src/components/chart';

type Props = {
  data: IEvaluationDetail;
};

export function CompletionProgressChart({ data }: Props) {
  const theme = useTheme();
  const { t } = useTranslate('performance');

  // Preparar datos ANTES de cualquier return
  const hasData = data.competencies && data.competencies.length > 0;

  // Calcular la contribución promedio por tipo de evaluador
  const relationshipContributions = new Map<string, number[]>();

  if (hasData) {
    data.competencies.forEach((comp) => {
      comp.breakdownByRole.forEach((role) => {
        if (!relationshipContributions.has(role.relationship)) {
          relationshipContributions.set(role.relationship, []);
        }
        relationshipContributions.get(role.relationship)!.push(role.scoreContribution);
      });
    });
  }

  const hasEvaluators = relationshipContributions.size > 0;

  // Calcular el promedio de contribución por cada tipo
  const pieData = hasEvaluators ? Array.from(relationshipContributions.entries()).map(([relationship, contributions]) => {
    const avgContribution = contributions.reduce((sum, val) => sum + val, 0) / contributions.length;
    return {
      name: t(`evaluation-detail.relationships.${relationship}`, { defaultValue: relationship }),
      value: Number(avgContribution.toFixed(1)),
      relationship,
    };
  }) : [];

  const labels = pieData.map((item) => item.name);
  const series = pieData.map((item) => item.value);

  // Colores por tipo de relación
  const relationshipColors: Record<string, string> = {
    MANAGER: theme.palette.primary.main,
    PEER: theme.palette.success.main,
    SELF: theme.palette.info.main,
    SUPERVISOR: theme.palette.warning.main,
    SUBORDINATE: theme.palette.secondary.main,
  };

  const colors = pieData.map((item) => relationshipColors[item.relationship] || theme.palette.grey[500]);

  // useChart DEBE estar antes de cualquier return
  const chartOptions = useChart({
    chart: {
      type: 'donut',
    },
    labels,
    legend: {
      position: 'bottom',
      fontSize: '12px',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              formatter: (val: string) => `${Number(val).toFixed(1)}%`,
            },
            total: {
              show: true,
              label: t('evaluation-detail.competencies.totalContribution'),
              fontSize: '12px',
              fontWeight: 600,
              formatter: () => {
                const total = series.reduce((acc, val) => acc + val, 0);
                return `${total.toFixed(1)}%`;
              },
            },
          },
        },
      },
    },
    colors,
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontSize: '11px',
        fontWeight: 600,
      },
      dropShadow: {
        enabled: false,
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toFixed(1)}% de contribución promedio`,
      },
    },
  });

  // AHORA SÍ los returns condicionales
  if (!hasData) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="body2">
          {t('evaluation-detail.chart.noData')}
        </Typography>
      </Box>
    );
  }

  if (!hasEvaluators) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="body2">
          {t('evaluation-detail.chart.noEvaluators')}
        </Typography>
      </Box>
    );
  }

  return (
    <Chart
      type="donut"
      series={series}
      options={chartOptions}
      sx={{ height: 400 }}
    />
  );
}
