'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { SeoIllustration } from 'src/assets/illustrations';
import {
  _talentKPIs,
  _resourceStatus,
  _recentTrainings,
  _competencyLevels,
  _competencyScores,
  // _nineBoxEmployees,
  // _performanceReviews,
  _learningPathProgress,
} from 'src/_mock/_talent';

import { svgColorClasses } from 'src/components/svg-color';

import { useAuthContext } from 'src/auth/hooks';

import { AppWidget } from '../app-widget';
import { AppWelcome } from '../app-welcome';
import { AppWidgetSummary } from '../app-widget-summary';
// import { TalentNineBox } from '../../../talent/talent-nine-box';
import { TalentCompetencyMap } from '../../../talent/talent-competency-map';
import { TalentLearningPaths } from '../../../talent/talent-learning-paths';
import { TalentResourceStatus } from '../../../talent/talent-resource-status';
import { TalentCompetencyRadar } from '../../../talent/talent-competency-radar';
import { TalentRecentTrainings } from '../../../talent/talent-recent-trainings';
// import { TalentPerformanceReviews } from '../../../talent/talent-performance-reviews';

// ----------------------------------------------------------------------

export function OverviewAppView() {
  const { t } = useTranslate('dashboard');
  const { user } = useAuthContext();

  const theme = useTheme();

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        {/* Bienvenida */}
        <Grid size={{ xs: 12, md: 8 }}>
          <AppWelcome
            title={`${t('welcome')} 👋 \n ${user?.displayName}`}
            email={user?.email}
            description={t('description')}
            img={<SeoIllustration hideBackground />}
            action={
              <Button variant="contained" color="primary">
                {t('actions.viewReports')}
              </Button>
            }
          />
        </Grid>

        {/* Widget Cards - Métricas Rápidas */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
            <AppWidget
              title={t('widgets.activeRoutes')}
              total={_talentKPIs.retentionRate}
              icon="solar:star-bold"
              chart={{ series: 68 }}
            />

            <AppWidget
              title={t('widgets.licensesExpiring')}
              total={_talentKPIs.jobSatisfaction}
              icon="solar:bell-bing-bold-duotone"
              chart={{
                series: 15,
                colors: [theme.vars.palette.warning.light, theme.vars.palette.warning.main],
              }}
              sx={{ bgcolor: 'warning.dark', [`& .${svgColorClasses.root}`]: { color: 'warning.light' } }}
            />
          </Box>
        </Grid>

        {/* Widgets Adicionales - ARRIBA DE LOS KPIs */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AppWidget
            title={t('widgets.pendingEvaluations')}
            total={34}
            icon="solar:pen-bold"
            chart={{ 
              series: 68,
              colors: [theme.vars.palette.warning.light, theme.vars.palette.warning.main],
            }}
            sx={{ bgcolor: 'warning.dark', [`& .${svgColorClasses.root}`]: { color: 'warning.light' } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AppWidget
            title={t('widgets.newHires')}
            total={18}
            icon="solar:user-plus-bold"
            chart={{
              series: 82,
              colors: [theme.vars.palette.info.light, theme.vars.palette.info.main],
            }}
            sx={{ bgcolor: 'info.dark', [`& .${svgColorClasses.root}`]: { color: 'info.light' } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AppWidget
            title={t('widgets.developmentPlans')}
            total={156}
            icon="solar:star-bold"
            chart={{
              series: 94,
              colors: [theme.vars.palette.success.light, theme.vars.palette.success.main],
            }}
            sx={{ bgcolor: 'success.dark', [`& .${svgColorClasses.root}`]: { color: 'success.light' } }}
          />
        </Grid>

        {/* KPIs Principales */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title={t('kpis.totalEmployees')}
            percent={5.2}
            total={_talentKPIs.totalEmployees}
            chart={{
              categories: [t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'), t('months.may'), t('months.jun'), t('months.jul'), t('months.aug')],
              series: [220, 225, 230, 235, 238, 242, 245, 247],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title={t('kpis.avgCompetency')}
            percent={3.8}
            total={_talentKPIs.avgCompetencyScore}
            chart={{
              colors: [theme.palette.info.main],
              categories: [t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'), t('months.may'), t('months.jun'), t('months.jul'), t('months.aug')],
              series: [72, 74, 75, 76, 77, 77.5, 78, 78.5],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title={t('kpis.trainings')}
            percent={12.5}
            total={_talentKPIs.completedTrainings}
            chart={{
              colors: [theme.palette.success.main],
              categories: [t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'), t('months.may'), t('months.jun'), t('months.jul'), t('months.aug')],
              series: [98, 102, 110, 115, 122, 128, 135, 142],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title={t('kpis.assignedTeams')}
            percent={8.5}
            total={_talentKPIs.openPositions}
            chart={{
              colors: [theme.palette.info.main],
              categories: [t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'), t('months.may'), t('months.jun'), t('months.jul'), t('months.aug')],
              series: [142, 145, 148, 150, 152, 154, 155, 156],
            }}
          />
        </Grid>

        {/* Gráfico de Araña Grande - Competencias */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <TalentCompetencyRadar 
            title={t('talent.competencyRadar.title')}
            subheader={t('talent.competencyRadar.subtitle')}
            chart={{
              series: [
                {
                  name: t('talent.competencyRadar.currentScore'),
                  data: _competencyScores.map((c: any) => c.score),
                },
                {
                  name: t('talent.competencyRadar.target'),
                  data: _competencyScores.map((c: any) => c.target),
                },
              ],
              categories: _competencyScores.map((c: any) => c.name),
            }}
          />
        </Grid>

        {/* Mapa de Competencias */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <TalentCompetencyMap 
            title={t('talent.competencyMap.title')}
            subheader={t('talent.competencyMap.subtitle')}
            list={_competencyLevels}
          />
        </Grid>

        {/* Gráfico de Rutas de Aprendizaje */}
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <TalentLearningPaths
            title={t('talent.learningPaths.title')}
            subheader={t('talent.learningPaths.subtitle')}
            chart={{
              series: _learningPathProgress,
              colors: ['#00AB55', '#FFC107', '#919EAB'],
            }}
          />
        </Grid>

        {/* Gráfico de Estado de Recursos */}
        <Grid size={{ xs: 12, md: 6, lg: 7 }}>
          <TalentResourceStatus
            title={t('talent.resourceStatus.title')}
            subheader={t('talent.resourceStatus.subtitle')}
            chart={{
              series: [
                {
                  name: t('talent.resourceStatus.quantity'),
                  data: _resourceStatus.map((item: any) => item.value),
                },
              ],
              categories: _resourceStatus.map((item: any) => item.label),
              colors: ['#00AB55', '#FFC107', '#3366FF', '#919EAB'],
            }}
          />
        </Grid>

        {/* Tabla de Gestión de Desempeño */}
        {/* <Grid size={{ xs: 12 }}>
          <TalentPerformanceReviews
            title="Gestión de Desempeño"
            subheader={`Evaluaciones de ${_performanceReviews.length} empleados destacados`}
            tableData={_performanceReviews}
          />
        </Grid> */}

        {/* Nine Box - Matriz de Talento */}
        {/* <Grid size={{ xs: 12 }}>
          <TalentNineBox
            title="Nine Box - Matriz de Talento y Desempeño"
            subheader="Evaluación de potencial vs desempeño de colaboradores clave"
            employees={_nineBoxEmployees}
          />
        </Grid> */}

        {/* Tabla de Capacitaciones Recientes */}
        <Grid size={{ xs: 12 }}>
          <TalentRecentTrainings
            title={t('talent.recentTrainings.title')}
            subheader={`${_recentTrainings.length} ${t('talent.recentTrainings.subtitle')}`}
            tableData={_recentTrainings}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
