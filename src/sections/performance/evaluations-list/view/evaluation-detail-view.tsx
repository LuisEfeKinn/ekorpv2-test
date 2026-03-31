'use client';

import type { IEvaluationDetail } from 'src/types/performance';

import { usePopover } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axios, { endpoints } from 'src/utils/axios';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetEvaluationListByIdService } from 'src/services/performance/evaluations-list.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomPopover } from 'src/components/custom-popover';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SpiderEvaluatorChart } from '../spider-evaluator-chart';
import { EvaluationDetailHeader } from '../evaluation-detail-header';
import { CompletionProgressChart } from '../completion-progress-chart';
import { ComplianceByCompetencyChart } from '../compliance-by-competency-chart';
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
  const [exporting, setExporting] = useState(false);

  const exportPopover = usePopover();

  const handleExport = useCallback(
    async (format: 0 | 1) => {
      setExporting(true);
      exportPopover.onClose();
      try {
        const exportEndpoint = `${endpoints.performance.evaluationsList.byId}/${id}/competency-gap`;
        
        const response = await axios.get(exportEndpoint, {
          params: {
            exportFormat: format,
          },
          responseType: 'blob',
        });
        
        // Crear un blob con la respuesta
        const blob = new Blob([response.data], {
          type: format === 0 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/pdf',
        });
        
        // Crear URL temporal y descargar
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `evaluacion_detalle_${id}_${new Date().getTime()}.${format === 0 ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success(t('evaluation-detail.messages.success.exported'));
      } catch (err) {
        console.error('Error exporting evaluation detail:', err);
        toast.error(t('evaluation-detail.messages.error.exporting'));
      } finally {
        setExporting(false);
      }
    },
    [id, exportPopover, t]
  );

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
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:download-bold" />}
              onClick={exportPopover.onOpen}
              disabled={exporting}
            >
              {exporting ? t('evaluation-detail.actions.exporting') : t('evaluation-detail.actions.export')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={() => router.push(paths.dashboard.performance.evaluationsList)}
            >
              {t('evaluation-detail.breadcrumbs.evaluationsList')}
            </Button>
          </Stack>
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
              <ComplianceByCompetencyChart data={data} />
            </Card>

            {/* Gráfico de progreso de completitud */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {t('evaluation-detail.chart.completionProgress')}
              </Typography>
              <CompletionProgressChart data={data} />
            </Card>
          </Stack>
        )}

        {/* Gráfico Spider - Full Width */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {t('evaluation-detail.spider.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('evaluation-detail.spider.description')}
          </Typography>
          <SpiderEvaluatorChart participantId={id} />
        </Card>

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

      <CustomPopover
        open={exportPopover.open}
        anchorEl={exportPopover.anchorEl}
        onClose={exportPopover.onClose}
        slotProps={{ arrow: { placement: 'top-right' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => handleExport(0)}
            disabled={exporting}
          >
            <Iconify icon="solar:file-text-bold" />
            {t('evaluation-detail.actions.exportExcel')}
          </MenuItem>

          <MenuItem
            onClick={() => handleExport(1)}
            disabled={exporting}
          >
            <Iconify icon="solar:file-text-bold" />
            {t('evaluation-detail.actions.exportPdf')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </DashboardContent>
  );
}
