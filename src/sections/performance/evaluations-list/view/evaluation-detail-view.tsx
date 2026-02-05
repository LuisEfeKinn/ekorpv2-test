'use client';

import type { IEvaluationDetail } from 'src/types/performance';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetEvaluationListByIdService } from 'src/services/performance/evaluations-list.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EvaluationDetailHeader } from '../evaluation-detail-header';
import { EvaluationDetailCompetenceCard } from '../evaluation-detail-competence-card';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function EvaluationDetailView({ id }: Props) {
  const { t } = useTranslate('performance');
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<IEvaluationDetail | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await GetEvaluationListByIdService(id);
        
        if (response?.data?.data) {
          setData(response?.data?.data);
        } else {
          setError(true);
          toast.error(t('evaluation-detail.messages.error.notFound'));
        }
      } catch (err) {
        console.error('Error loading evaluation detail:', err);
        setError(true);
        toast.error(t('evaluation-detail.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, t]);

  // Gráfico general de cumplimiento
  const complianceChartOptions = useChart({
    chart: {
      type: 'bar',
      toolbar: { show: true },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
      offsetX: 0,
      style: {
        fontSize: '12px',
        colors: ['#fff'],
      },
    },
    xaxis: {
      categories: data?.competencies.map((comp) => comp.competenceName) || [],
      max: 100,
    },
    colors: [theme.palette.primary.main],
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
    },
  });

  const complianceChartSeries = [
    {
      name: t('evaluation-detail.competencies.compliance'),
      data: data?.competencies.map((comp) => comp.compliancePercentage) || [],
    },
  ];

  // Gráfico de progreso de completitud
  const completionChartOptions = useChart({
    chart: {
      type: 'donut',
    },
    labels: data?.competencies.map((comp) => comp.competenceName) || [],
    legend: {
      position: 'bottom',
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: t('evaluation-detail.competencies.completion'),
              formatter: () => {
                const totalQuestions = data?.competencies.reduce(
                  (acc, comp) => acc + comp.totalQuestions,
                  0
                ) || 0;
                const answeredQuestions = data?.competencies.reduce(
                  (acc, comp) => acc + comp.answeredQuestions,
                  0
                ) || 0;
                return totalQuestions ? `${((answeredQuestions / totalQuestions) * 100).toFixed(0)}%` : '0%';
              },
            },
          },
        },
      },
    },
    colors: data?.competencies.map((comp) => comp.color || theme.palette.primary.main) || [],
  });

  const completionChartSeries = data?.competencies.map((comp) => comp.answeredQuestions) || [];

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !data) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('evaluation-detail.title')}
          links={[
            {
              name: t('evaluation-detail.breadcrumbs.dashboard'),
              href: paths.dashboard.root,
            },
            {
              name: t('evaluation-detail.breadcrumbs.evaluationsList'),
              href: paths.dashboard.performance.evaluationsList,
            },
            {
              name: t('evaluation-detail.breadcrumbs.detail'),
            },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <EmptyContent
          filled
          title={t('evaluation-detail.empty.title')}
          description={t('evaluation-detail.empty.description')}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={() => router.push(paths.dashboard.performance.evaluationsList)}
            >
              {t('evaluation-detail.breadcrumbs.evaluationsList')}
            </Button>
          }
          sx={{ py: 10 }}
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('evaluation-detail.title')}
        links={[
          {
            name: t('evaluation-detail.breadcrumbs.dashboard'),
            href: paths.dashboard.root,
          },
          {
            name: t('evaluation-detail.breadcrumbs.evaluationsList'),
            href: paths.dashboard.performance.evaluationsList,
          },
          {
            name: data.employeeName,
          },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={() => router.push(paths.dashboard.performance.evaluationsList)}
          >
            {t('evaluation-detail.breadcrumbs.evaluationsList')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        {/* Header con información general */}
        <EvaluationDetailHeader data={data} />

        {/* Gráficos generales */}
        {data.competencies.length > 0 && (
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
            {/* Gráfico de cumplimiento por competencia */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {t('evaluation-detail.chart.complianceByCompetence')}
              </Typography>
              <Chart
                type="bar"
                series={complianceChartSeries}
                options={complianceChartOptions}
                sx={{ height: 320 }}
              />
            </Card>

            {/* Gráfico de progreso de completitud */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {t('evaluation-detail.chart.completionProgress')}
              </Typography>
              <Chart
                type="donut"
                series={completionChartSeries}
                options={completionChartOptions}
                sx={{ height: 320 }}
              />
            </Card>
          </Stack>
        )}

        {/* Título de competencias */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderRadius: 1,
          }}
        >
          <Iconify icon="solar:file-bold-duotone" width={32} color="primary.main" />
          <Typography variant="h5">{t('evaluation-detail.competencies.title')}</Typography>
        </Box>

        {/* Lista de competencias detalladas */}
        {data.competencies.length > 0 ? (
          <Stack spacing={3}>
            {data.competencies.map((competence) => (
              <EvaluationDetailCompetenceCard
                key={competence.competenceId}
                competence={competence}
              />
            ))}
          </Stack>
        ) : (
          <Card sx={{ p: 5 }}>
            <EmptyContent
              title={t('evaluation-detail.competencies.noCompetencies')}
              sx={{ py: 5 }}
            />
          </Card>
        )}
      </Stack>
    </DashboardContent>
  );
}
