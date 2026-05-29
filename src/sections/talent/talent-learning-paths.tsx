import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import { useTranslate } from 'src/locales';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  chart: {
    colors?: string[];
    series: {
      label: string;
      value: number;
    }[];
    options?: ChartOptions;
  };
};

export function TalentLearningPaths({ title, subheader, chart, ...other }: Props) {
  const { t } = useTranslate('dashboard');
  const chartColors = chart.colors;

  const chartSeries = chart.series.map((item) => item.value);

  const chartOptions = useChart({
    chart: {
      sparkline: {
        enabled: true,
      },
    },
    colors: chartColors,
    labels: chart.series.map((item) => t(`${item.label}`)),
    stroke: {
      width: 0,
    },
    legend: {
      show: true,
      position: 'bottom',
      offsetY: 0,
      horizontalAlign: 'center',
      fontSize: '14px',
      markers: {
        size: 12,
      },
    },
    dataLabels: {
      enabled: true,
      dropShadow: {
        enabled: false,
      },
    },
    tooltip: {
      fillSeriesColor: false,
      y: {
        formatter: (value: number) => `${value} ${t('talent.learningPaths.paths')}`,
        title: {
          formatter: (seriesName: string) => `${seriesName}:`,
        },
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            value: {
              fontSize: '18px',
              fontWeight: 600,
            },
            total: {
              show: true,
              label: t('talent.learningPaths.totalPaths'),
              fontSize: '14px',
              fontWeight: 500,
              formatter: () => {
                const total = chart.series.reduce((acc, item) => acc + item.value, 0);
                return `${total}`;
              },
            },
          },
        },
      },
    },
    ...chart.options,
  });

  return (
    <Card {...other}>
      <CardHeader 
        title={t('talent.learningPaths.title')} 
        subheader={t('talent.learningPaths.subtitle')} 
      />

      <Chart
        type="donut"
        series={chartSeries}
        options={chartOptions}
        sx={{
          py: 2.5,
          pl: 1,
          pr: 2.5,
          height: 380,
        }}
      />
    </Card>
  );
}
