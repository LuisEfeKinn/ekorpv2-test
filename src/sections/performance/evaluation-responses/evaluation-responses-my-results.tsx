import type { IMyResults, IMyResultsCompetence } from 'src/types/performance';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

type Props = {
  loading: boolean;
  myResults: IMyResults | null;
};

export function EvaluationResponsesMyResults({ loading, myResults }: Props) {
  const theme = useTheme();
  const { t } = useTranslate('performance');

  const relationshipLabels: { [key: string]: string } = {
    MANAGER: t('evaluation-responses.relationships.MANAGER'),
    PEER: t('evaluation-responses.relationships.PEER'),
    SUBORDINATE: t('evaluation-responses.relationships.SUBORDINATE'),
    SELF: t('evaluation-responses.relationships.SELF'),
    OTHER: t('evaluation-responses.relationships.OTHER'),
  };

  const getGapColor = (gap: number) => {
    if (gap >= 0) return theme.palette.success.main;
    if (gap >= -1) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!myResults || !myResults.competencies || myResults.competencies.length === 0) {
    return (
      <EmptyContent
        filled
        title={t('evaluation-responses.messages.noData')}
        sx={{ py: 10 }}
      />
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header Card - Overall Score */}
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: alpha(theme.palette.primary.main, 0.16),
                color: theme.palette.primary.main,
              }}
            >
              <Iconify icon="solar:user-rounded-bold" width={32} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {myResults.employeeName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('evaluation-responses.myResults.subtitle')}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  {t('evaluation-responses.myResults.overallScore')}
                </Typography>
                <Typography variant="h3" color="primary.main">
                  {myResults.overallCompetencyScore.toFixed(2)}
                </Typography>
              </Box>
              <Iconify
                icon="solar:cup-star-bold"
                width={56}
                sx={{ color: 'primary.main', opacity: 0.24 }}
              />
            </Stack>
          </Box>
        </Stack>
      </Card>

      {/* Competencies Grid */}
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>
          {t('evaluation-responses.myResults.competenciesTitle')}
        </Typography>
        <Grid container spacing={3}>
          {myResults.competencies.map((competence) => (
            <Grid key={competence.competenceId} size={{ xs: 12, md: 6 }}>
              <CompetenceCard
                competence={competence}
                relationshipLabels={relationshipLabels}
                getGapColor={getGapColor}
                getComplianceColor={getComplianceColor}
                t={t}
                theme={theme}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

type CompetenceCardProps = {
  competence: IMyResultsCompetence;
  relationshipLabels: { [key: string]: string };
  getGapColor: (gap: number) => string;
  getComplianceColor: (percentage: number) => 'success' | 'warning' | 'error';
  t: (key: string) => string;
  theme: any;
};

function CompetenceCard({
  competence,
  relationshipLabels,
  getGapColor,
  getComplianceColor,
  t,
  theme,
}: CompetenceCardProps) {
  return (
    <Card
      sx={{
        p: 3,
        height: '100%',
        borderLeft: `4px solid ${competence.color || theme.palette.primary.main}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: theme.shadows[20],
          transform: 'translateY(-4px)',
        },
      }}
    >
      <Stack spacing={2.5}>
        {/* Header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {competence.competenceName}
            </Typography>
            <Label
              variant="soft"
              color={getComplianceColor(competence.compliancePercentage)}
              sx={{ mt: 0.5 }}
            >
              {t('evaluation-responses.myResults.compliance')}: {competence.compliancePercentage.toFixed(1)}%
            </Label>
          </Box>
        </Stack>

        {/* Levels Comparison */}
        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.grey[500], 0.04),
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="solar:star-bold" width={20} color="text.secondary" />
                <Typography variant="body2" color="text.secondary">
                  {t('evaluation-responses.myResults.expectedLevel')}
                </Typography>
              </Stack>
              <Typography variant="h6">{competence.expectedLevel.toFixed(1)}</Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="solar:cup-star-bold" width={20} color="primary.main" />
                <Typography variant="body2" color="text.secondary">
                  {t('evaluation-responses.myResults.obtainedLevel')}
                </Typography>
              </Stack>
              <Typography variant="h6" color="primary.main">
                {competence.obtainedLevel.toFixed(1)}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify
                  icon={competence.gap >= 0 ? 'eva:trending-up-fill' : 'eva:trending-down-fill'}
                  width={20}
                  sx={{ color: getGapColor(competence.gap) }}
                />
                <Typography variant="body2" color="text.secondary">
                  {t('evaluation-responses.myResults.gap')}
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{ color: getGapColor(competence.gap), fontWeight: 700 }}
              >
                {competence.gap > 0 ? '+' : ''}
                {competence.gap.toFixed(1)}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Progress Bar */}
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {t('evaluation-responses.myResults.progress')}
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {competence.compliancePercentage.toFixed(1)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(competence.compliancePercentage, 100)}
            color={getComplianceColor(competence.compliancePercentage)}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.grey[500], 0.16),
            }}
          />
        </Box>

        {/* Breakdown by Role */}
        {competence.breakdownByRole && competence.breakdownByRole.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              {t('evaluation-responses.myResults.breakdownByRole')}
            </Typography>
            <Stack spacing={1.5}>
              {competence.breakdownByRole.map((role, index) => (
                <Stack
                  key={index}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.grey[500], 0.04),
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      }}
                    >
                      <Iconify icon="solar:user-id-bold" width={18} color="primary.main" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {relationshipLabels[role.relationship] || role.relationship}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('evaluation-responses.myResults.weight')}: {role.weight}%
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack alignItems="flex-end">
                    <Typography variant="h6" color="primary.main">
                      {role.score.toFixed(1)}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Card>
  );
}
