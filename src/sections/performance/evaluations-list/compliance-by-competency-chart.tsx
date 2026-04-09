import type { IEvaluationDetail } from 'src/types/performance';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Chart, useChart } from 'src/components/chart';

type Props = {
  data: IEvaluationDetail;
};

export function ComplianceByCompetencyChart({ data }: Props) {
  const theme = useTheme();
  const { t } = useTranslate('performance');

  // Preparar datos ANTES de los hooks
  const hasData = data.competencies && data.competencies.length > 0;
  const categories = hasData ? data.competencies.map((comp) => comp.competenceName) : [];
  
  // Obtener todos los tipos de relaciones únicos
  const allRelationships = hasData ? Array.from(
    new Set(
      data.competencies.flatMap((comp) => 
        comp.breakdownByRole.map((role) => role.relationship)
      )
    )
  ) : [];

  const hasEvaluators = allRelationships.length > 0;

  // Crear series por tipo de evaluador mostrando scoreContribution
  const series = hasEvaluators ? allRelationships.map((relationship) => ({
    name: t(`evaluation-detail.relationships.${relationship}`, { defaultValue: relationship }),
    data: data.competencies.map((comp) => {
      const roleData = comp.breakdownByRole.find((role) => role.relationship === relationship);
      return roleData ? Number(roleData.scoreContribution.toFixed(1)) : 0;
    }),
  })) : [];

  // useChart DEBE estar antes de cualquier return
  const chartOptions = useChart({
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: true },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: {
          position: 'center',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        if (val === 0 || val < 5) return '';
        return `${val.toFixed(1)}%`;
      },
      style: {
        fontSize: '10px',
        colors: ['#fff'],
      },
    },
    xaxis: {
      categories,
      max: 100,
      title: {
        text: t('evaluation-detail.competencies.compliancePercentage'),
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '11px',
        },
      },
    },
    colors: [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      theme.palette.error.main,
    ],
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toFixed(1)}%`,
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
      type="bar"
      series={series}
      options={chartOptions}
      sx={{ height: 400 }}
    />
  );
}
