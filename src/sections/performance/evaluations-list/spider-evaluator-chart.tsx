import type { ISpiderData } from 'src/types/performance';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetSpiderEvaluatorService } from 'src/services/performance/evaluations-list.service';

import { toast } from 'src/components/snackbar';
import { Chart, useChart } from 'src/components/chart';

type Props = {
  participantId: string | number;
};

export function SpiderEvaluatorChart({ participantId }: Props) {
  // IMPORTANTE: Todos los hooks deben estar al inicio, antes de cualquier return
  const theme = useTheme();
  const { t } = useTranslate('performance');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ISpiderData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await GetSpiderEvaluatorService(participantId);
        if (response?.data?.data) {
          setData(response.data.data);
        } else {
          toast.error(t('evaluation-detail.messages.error.loadingSpider'));
        }
      } catch (err) {
        console.error('Error loading spider evaluator data:', err);
        toast.error(t('evaluation-detail.messages.error.loadingSpider'));
      } finally {
        setLoading(false);
      }
    };

    if (participantId) {
      fetchData();
    }
  }, [participantId, t]);

  // Preparar datos para el gráfico (antes de los returns condicionales)
  const categories = data?.competencies.map((comp) => comp.competenceName) || [];
  
  // Crear serie para nivel esperado
  const expectedSeries = data ? {
    name: t('evaluation-detail.spider.expectedLevel'),
    data: data.competencies.map((comp) => comp.expectedLevel),
    color: theme.palette.warning.main,
  } : null;

  // Crear series para cada evaluador
  const evaluatorSeriesMap = new Map<number, { name: string; relationship: string; data: number[] }>();
  
  if (data) {
    data.competencies.forEach((comp) => {
      comp.evaluators.forEach((evaluator) => {
        if (!evaluatorSeriesMap.has(evaluator.evaluatorId)) {
          evaluatorSeriesMap.set(evaluator.evaluatorId, {
            name: `${evaluator.displayName} (${t(`evaluation-detail.relationships.${evaluator.relationship}`, { defaultValue: evaluator.relationship })})`,
            relationship: evaluator.relationship,
            data: new Array(data.competencies.length).fill(0),
          });
        }
      });
    });

    // Llenar datos de evaluadores
    data.competencies.forEach((comp, compIndex) => {
      comp.evaluators.forEach((evaluator) => {
        const series = evaluatorSeriesMap.get(evaluator.evaluatorId);
        if (series) {
          series.data[compIndex] = evaluator.score;
        }
      });
    });
  }

  const evaluatorSeries = Array.from(evaluatorSeriesMap.values());

  // Colores para evaluadores basados en su relación
  const relationshipColors: Record<string, string> = {
    SELF: theme.palette.info.main,
    PEER: theme.palette.success.main,
    SUPERVISOR: theme.palette.primary.main,
    SUBORDINATE: theme.palette.secondary.main,
  };

  const allSeries = expectedSeries ? [
    expectedSeries,
    ...evaluatorSeries.map((series) => ({
      ...series,
      color: relationshipColors[series.relationship] || theme.palette.grey[500],
    })),
  ] : [];

  const chartOptions = useChart({
    chart: {
      type: 'radar',
      toolbar: { show: false },
      dropShadow: {
        enabled: true,
        blur: 4,
        left: 0,
        top: 0,
        opacity: 0.1,
      },
    },
    stroke: {
      width: 2,
    },
    fill: {
      opacity: 0.2,
    },
    markers: {
      size: 4,
      hover: {
        size: 6,
      },
    },
    xaxis: {
      categories,
      labels: {
        style: {
          fontSize: '11px',
          fontWeight: 500,
          colors: Array(categories.length).fill(theme.palette.text.secondary),
        },
      },
    },
    yaxis: {
      show: true,
      min: 0,
      max: data?.scaleMax || 5,
      tickAmount: data?.scaleMax || 5,
      labels: {
        style: {
          fontSize: '10px',
          colors: theme.palette.text.disabled,
        },
      },
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '12px',
      itemMargin: {
        horizontal: 12,
        vertical: 8,
      },
    },
    plotOptions: {
      radar: {
        size: undefined,
        polygons: {
          strokeColors: theme.palette.divider,
          connectorColors: theme.palette.divider,
          fill: {
            colors: [
              theme.palette.mode === 'light' 
                ? theme.palette.grey[100]
                : theme.palette.grey[800],
              'transparent',
            ],
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} / ${data?.scaleMax || 5}`,
      },
    },
    colors: allSeries.map((s) => s.color),
  });

  // AHORA SÍ los returns condicionales, DESPUÉS de todos los hooks
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!data || data.competencies.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <Typography variant="body2">
          {t('evaluation-detail.spider.noData')}
        </Typography>
      </Box>
    );
  }

  return (
    <Chart
      type="radar"
      series={allSeries.map((s) => ({ name: s.name, data: s.data }))}
      options={chartOptions}
      sx={{ height: 600 }}
    />
  );
}
