'use client';

import Grid from '@mui/material/Grid';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { _nineBoxEmployees, _performanceReviews } from 'src/_mock/_talent';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TalentNineBox } from '../../../../../talent/talent-nine-box';
import { TalentPerformanceReviews } from '../../../../../talent/talent-performance-reviews';

// ----------------------------------------------------------------------

export function EvaluateView() {
  const { t } = useTranslate('dashboard');

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={t('performance.evaluate.heading')}
        links={[
          { name: t('performance.evaluate.links.dashboard'), href: paths.dashboard.root },
          { name: t('performance.evaluate.links.performanceEvaluation') },
          { name: t('performance.evaluate.heading') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {/* Nine Box - Matriz de Talento */}
        <Grid size={{ xs: 12 }}>
          <TalentNineBox
            title={t('performance.evaluate.nineBox.title')}
            subheader={t('performance.evaluate.nineBox.subheader')}
            employees={_nineBoxEmployees}
          />
        </Grid>

        {/* Tabla de Gestión de Desempeño */}
        <Grid size={{ xs: 12 }}>
          <TalentPerformanceReviews
            title={t('performance.evaluate.performanceReviews.title')}
            subheader={t('performance.evaluate.performanceReviews.subheader', {
              count: _performanceReviews.length,
            })}
            tableData={_performanceReviews}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
