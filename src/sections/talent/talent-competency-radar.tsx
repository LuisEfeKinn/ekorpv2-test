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
    categories?: string[];
    series: {
      name: string;
      data: number[];
    }[];
    options?: ChartOptions;
  };
};

export function TalentCompetencyRadar({ title, subheader, chart, ...other }: Props) {
  const { t } = useTranslate('dashboard');
  const chartColors = chart.colors;

  const translatedCategories = chart.categories?.map((category) => t(`${category}`));

  const chartOptions = useChart({
    colors: chartColors,
    stroke: { width: 2 },
    fill: { opacity: 0.48 },
    chart: {
      toolbar: {
        show: true,
      },
    },
    markers: {
      size: 4,
    },
    xaxis: {
      categories: translatedCategories,
      labels: {
        style: {
          fontSize: '14px',
          fontWeight: 600,
        },
      },
    },
    yaxis: {
      show: true,
      tickAmount: 4,
    },
    plotOptions: {
      radar: {
        size: 180,
        polygons: {
          strokeColors: '#e8e8e8',
          fill: {
            colors: ['#f8f8f8', '#fff'],
          },
        },
      },
    },
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '14px',
    },
    ...chart.options,
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Chart
        type="radar"
        series={chart.series}
        options={chartOptions}
        sx={{
          py: 2.5,
          pl: 1,
          pr: 2.5,
          height: 480,
        }}
      />
    </Card>
  );
}
