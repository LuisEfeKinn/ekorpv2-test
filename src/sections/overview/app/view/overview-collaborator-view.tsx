'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { SeoIllustration } from 'src/assets/illustrations';
import {
  _personalKPIs,
  _personalPoints,
  _personalResourceStatus,
  _personalCompetencyScores,
  _personalCompetencyLevels,
  _personalLearningPathsWithCourses,
} from 'src/_mock/_personal';

import { svgColorClasses } from 'src/components/svg-color';

import { useAuthContext } from 'src/auth/hooks';

import { AppWidget } from '../app-widget';
import { AppWelcome } from '../app-welcome';
import { AppWidgetSummary } from '../app-widget-summary';
import { PersonalCoursesTable } from '../personal-courses-table';
import { TalentCompetencyMap } from '../../../talent/talent-competency-map';
import { TalentLearningPaths } from '../../../talent/talent-learning-paths';
import { TalentResourceStatus } from '../../../talent/talent-resource-status';
import { TalentCompetencyRadar } from '../../../talent/talent-competency-radar';

// ----------------------------------------------------------------------

export function OverviewCollaboratorView() {
  const { t } = useTranslate('dashboard');
  const { user } = useAuthContext();

  const theme = useTheme();

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        {/* Bienvenida Personal */}
        <Grid size={{ xs: 12, md: 8 }}>
          <AppWelcome
            title={`${t('personal.welcome')} 👋 \n ${user?.displayName}`}
            email={user?.email}
            description={t('personal.description')}
            img={<SeoIllustration hideBackground />}
            action={
              <Button variant="contained" color="primary">
                {t('personal.actions.viewProgress')}
              </Button>
            }
          />
        </Grid>

        {/* Widget Cards - Métricas Rápidas */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
            <AppWidget
              title={t('personal.widgets.activeLearningPaths')}
              total={_personalKPIs.activeLearningPaths}
              icon="solar:star-bold"
              chart={{ series: 100 }}
            />

            <AppWidget
              title={t('personal.widgets.expiringLicenses')}
              total={1}
              icon="solar:bell-bing-bold-duotone"
              chart={{
                series: 50,
                colors: [theme.vars.palette.warning.light, theme.vars.palette.warning.main],
              }}
              sx={{ bgcolor: 'warning.dark', [`& .${svgColorClasses.root}`]: { color: 'warning.light' } }}
            />
          </Box>
        </Grid>

        {/* Widgets Adicionales - Cursos y Puntos */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <AppWidget
            title={t('personal.widgets.coursesEnrolled')}
            total={_personalKPIs.coursesEnrolled}
            icon="solar:book-bold"
            chart={{ 
              series: 100,
              colors: [theme.vars.palette.info.light, theme.vars.palette.info.main],
            }}
            sx={{ bgcolor: 'info.dark', [`& .${svgColorClasses.root}`]: { color: 'info.light' } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <AppWidget
            title={t('personal.widgets.coursesPending')}
            total={_personalKPIs.coursesPending}
            icon="solar:clock-circle-bold"
            chart={{
              series: 22,
              colors: [theme.vars.palette.warning.light, theme.vars.palette.warning.main],
            }}
            sx={{ bgcolor: 'warning.dark', [`& .${svgColorClasses.root}`]: { color: 'warning.light' } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <AppWidget
            title={t('personal.widgets.coursesCompleted')}
            total={_personalKPIs.coursesCompleted}
            icon="solar:check-circle-bold"
            chart={{
              series: 67,
              colors: [theme.vars.palette.success.light, theme.vars.palette.success.main],
            }}
            sx={{ bgcolor: 'success.dark', [`& .${svgColorClasses.root}`]: { color: 'success.light' } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <AppWidget
            title={t('personal.widgets.totalPointsEarned')}
            total={_personalPoints.totalEarned}
            icon="solar:medal-star-bold"
            chart={{
              series: 85,
              colors: [theme.vars.palette.primary.light, theme.vars.palette.primary.main],
            }}
          />
        </Grid>

        {/* KPIs Personales usando AppWidgetSummary */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title={t('personal.kpis.averageScore')}
            percent={5.2}
            total={_personalKPIs.averageScore}
            chart={{
              categories: [t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'), t('months.may'), t('months.jun'), t('months.jul'), t('months.aug')],
              series: [85, 87, 88, 89, 90, 90.2, 90.5, 90.8],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title={t('personal.kpis.totalHours')}
            percent={12.5}
            total={_personalKPIs.completedLearningHours}
            chart={{
              colors: [theme.palette.success.main],
              categories: [t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'), t('months.may'), t('months.jun'), t('months.jul'), t('months.aug')],
              series: [180, 200, 220, 235, 240, 250, 253, 255],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title={t('personal.widgets.availableBalance')}
            percent={8.5}
            total={_personalPoints.availableBalance}
            chart={{
              colors: [theme.palette.info.main],
              categories: [t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'), t('months.may'), t('months.jun'), t('months.jul'), t('months.aug')],
              series: [1200, 1250, 1400, 1500, 1550, 1600, 1650, 1670],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppWidgetSummary
            title={t('personal.widgets.totalPointsSpent')}
            percent={15.2}
            total={_personalPoints.totalSpent}
            chart={{
              colors: [theme.palette.warning.main],
              categories: [t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'), t('months.may'), t('months.jun'), t('months.jul'), t('months.aug')],
              series: [500, 550, 600, 650, 700, 750, 770, 780],
            }}
          />
        </Grid>

        {/* Gráfico de Araña - Competencias Personales */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <TalentCompetencyRadar 
            title={t('personal.competency.radar.title')}
            subheader={t('personal.competency.radar.subtitle')}
            chart={{
              series: [
                {
                  name: t('personal.competency.radar.currentScore'),
                  data: _personalCompetencyScores.map((c) => c.score),
                },
                {
                  name: t('personal.competency.radar.target'),
                  data: _personalCompetencyScores.map((c) => c.target),
                },
              ],
              categories: _personalCompetencyScores.map((c) => c.name),
            }}
          />
        </Grid>

        {/* Distribución de Competencias Personales */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <TalentCompetencyMap 
            title={t('personal.competency.distribution.title')}
            subheader={t('personal.competency.distribution.subtitle')}
            list={_personalCompetencyLevels}
          />
        </Grid>

        {/* Gráfico de Rutas de Aprendizaje Personales */}
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <TalentLearningPaths
            title={t('personal.learningPaths.title')}
            subheader={t('personal.learningPaths.subtitle')}
            chart={{
              series: [
                { label: t('personal.learningPaths.completed'), value: 1 },
                { label: t('personal.learningPaths.inProgress'), value: 2 },
                { label: t('personal.learningPaths.notStarted'), value: 0 },
              ],
              colors: ['#00AB55', '#FFC107', '#919EAB'],
            }}
          />
        </Grid>

        {/* Estado de Recursos Personales */}
        <Grid size={{ xs: 12, md: 6, lg: 7 }}>
          <TalentResourceStatus
            title={t('personal.resources.title')}
            subheader={t('personal.resources.subtitle')}
            chart={{
              series: [
                {
                  name: 'Cantidad',
                  data: _personalResourceStatus.map((item) => item.value),
                },
              ],
              categories: _personalResourceStatus.map((item) => item.label),
              colors: ['#00AB55', '#FFC107', '#3366FF', '#919EAB'],
            }}
          />
        </Grid>

        {/* Tabla de Cursos Personales con estructura desplegable */}
        <Grid size={{ xs: 12 }}>
          <PersonalCoursesTable
            title={t('personal.courses.title')}
            subheader={`${_personalLearningPathsWithCourses.length} rutas de aprendizaje activas`}
            tableData={_personalLearningPathsWithCourses}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}