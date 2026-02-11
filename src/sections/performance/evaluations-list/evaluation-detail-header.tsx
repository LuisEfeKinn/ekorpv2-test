'use client';

import type { IEvaluationDetail } from 'src/types/performance';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  data: IEvaluationDetail;
};

export function EvaluationDetailHeader({ data }: Props) {
  const { t } = useTranslate('performance');
  const theme = useTheme();

  const totalQuestions = data.competencies.reduce(
    (acc, comp) => acc + comp.totalQuestions,
    0
  );
  const answeredQuestions = data.competencies.reduce(
    (acc, comp) => acc + comp.answeredQuestions,
    0
  );
  const completionRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const metrics = [
    {
      label: t('evaluation-detail.summary.overallScore'),
      value: data.overallCompetencyScore.toFixed(1),
      icon: 'solar:star-bold-duotone',
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.16),
    },
    {
      label: t('evaluation-detail.summary.competenciesEvaluated'),
      value: data.competencies.length,
      icon: 'solar:diploma-bold-duotone',
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.16),
    },
    {
      label: t('evaluation-detail.summary.completionRate'),
      value: `${completionRate.toFixed(0)}%`,
      icon: 'solar:chart-2-bold-duotone',
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.16),
    },
  ];

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Stack spacing={3}>
        {/* User Info */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: theme.palette.primary.main,
              fontSize: '1.5rem',
            }}
          >
            {data.employeeName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              {data.employeeName}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="solar:case-minimalistic-bold-duotone" width={20} />
              <Typography variant="body2" color="text.secondary">
                {data.campaignName}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {/* Metrics */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {metrics.map((metric, index) => (
            <Card
              key={index}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'background.neutral',
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: metric.bgColor,
                  color: metric.color,
                }}
              >
                <Iconify icon={metric.icon as any} width={28} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4">{metric.value}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
              </Box>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
