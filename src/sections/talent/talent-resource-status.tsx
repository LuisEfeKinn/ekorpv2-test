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
      name: string;
      data: number[];
    }[];
    categories: string[];
    options?: ChartOptions;
  };
};

export function TalentResourceStatus({ title, subheader, chart, ...other }: Props) {
  const { t } = useTranslate('dashboard');
  const chartColors = chart.colors;

  const translatedCategories = chart.categories.map((category) => t(`${category}`));

  const chartOptions = useChart({
    colors: chartColors,
    stroke: {
      width: 0,
    },
    xaxis: {
      categories: translatedCategories,
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '60%',
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      offsetX: 30,
      style: {
        fontSize: '12px',
        fontWeight: 600,
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value} ${t('talent.resourceStatus.quantity')}`,
      },
    },
    legend: {
      show: false,
    },
    grid: {
      strokeDashArray: 3,
      borderColor: 'rgba(145, 158, 171, 0.2)',
    },
    ...chart.options,
  });

  return (
    <Card {...other}>
      <CardHeader 
        title={t('talent.resourceStatus.title')} 
        subheader={t('talent.resourceStatus.subtitle')} 
      />

      <Chart
        type="bar"
        series={chart.series}
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
