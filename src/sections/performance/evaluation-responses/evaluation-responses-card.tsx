import type { IEvaluationResponse } from 'src/types/performance';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IEvaluationResponse;
};

export function EvaluationResponsesCard({ row }: Props) {
  const theme = useTheme();
  const { t } = useTranslate('performance');

  const popover = usePopover();

  const relationshipLabels: { [key: string]: string } = {
    MANAGER: t('evaluation-responses.relationships.MANAGER'),
    PEER: t('evaluation-responses.relationships.PEER'),
    SUBORDINATE: t('evaluation-responses.relationships.SUBORDINATE'),
    SELF: t('evaluation-responses.relationships.SELF'),
    OTHER: t('evaluation-responses.relationships.OTHER'),
  };

  const campaignTypeColors: { [key: string]: string } = {
    OBJECTIVES: theme.palette.info.main,
    PERFORMANCE_180: theme.palette.success.main,
    PERFORMANCE_270: theme.palette.warning.main,
    PERFORMANCE_360: theme.palette.error.main,
  };

  const isOverdue = new Date(row.deadline) < new Date() && !row.isCompleted;

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <Card
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: theme.shadows[20],
            transform: 'translateY(-4px)',
          },
        }}
      >
        {/* Header */}
        <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: alpha(campaignTypeColors[row.campaignType] || theme.palette.primary.main, 0.16),
              color: campaignTypeColors[row.campaignType] || theme.palette.primary.main,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {getInitials(row.participantName)}
          </Avatar>

          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap>
              {row.participantName}
            </Typography>
            <Label variant="soft" color="default" sx={{ width: 'fit-content' }}>
              {relationshipLabels[row.relationship] || row.relationship}
            </Label>
          </Stack>

          <IconButton
            color={popover.open ? 'inherit' : 'default'}
            onClick={popover.onOpen}
            sx={{ flexShrink: 0 }}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Stack>

        {/* Campaign Info */}
        <Stack spacing={2} sx={{ flex: 1 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              background: `linear-gradient(135deg, ${alpha(
                campaignTypeColors[row.campaignType] || theme.palette.primary.main,
                0.08
              )} 0%, ${alpha(
                campaignTypeColors[row.campaignType] || theme.palette.primary.main,
                0.02
              )} 100%)`,
              border: `1px solid ${alpha(
                campaignTypeColors[row.campaignType] || theme.palette.primary.main,
                0.16
              )}`,
            }}
          >
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {row.campaignName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t(`configure-evaluations.types.${row.campaignType}`)}
            </Typography>
          </Box>

          {/* Progress */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('evaluation-responses.table.columns.progress')}
              </Typography>
              <Typography variant="subtitle2" color={row.progress === 100 ? 'success.main' : 'text.primary'}>
                {row.progress}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={row.progress}
              color={row.progress === 100 ? 'success' : 'primary'}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.grey[500], 0.16),
              }}
            />
          </Box>

          {/* Deadline */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: isOverdue ? alpha(theme.palette.error.main, 0.08) : alpha(theme.palette.grey[500], 0.08),
            }}
          >
            <Iconify
              icon={isOverdue ? 'solar:calendar-date-bold' : 'solar:calendar-date-bold'}
              width={20}
              sx={{ color: isOverdue ? 'error.main' : 'text.secondary' }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {t('evaluation-responses.table.columns.deadline')}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                color={isOverdue ? 'error.main' : 'text.primary'}
              >
                {fDate(row.deadline)}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Status */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            {t('evaluation-responses.preview.status')}
          </Typography>
          <Label
            variant="soft"
            color={row.isCompleted ? 'success' : row.isCampaignActive ? 'warning' : 'default'}
          >
            {row.isCompleted
              ? t('evaluation-responses.statuses.COMPLETED')
              : row.isCampaignActive
                ? t('evaluation-responses.statuses.PENDING')
                : t('evaluation-responses.statuses.INACTIVE')}
          </Label>
        </Stack>
      </Card>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            component={RouterLink}
            href={
              row.campaignType === 'OBJECTIVES'
                ? paths.dashboard.performance.evaluationResponsesUserObjectives(row.assignmentId)
                : paths.dashboard.performance.evaluationResponsesUserHistory(row.assignmentId)
            }
            onClick={popover.onClose}
            disabled={!row.isCampaignActive || row.isCompleted}
          >
            <Iconify icon="solar:pen-bold" />
            {t('evaluation-responses.actions.respond')}
          </MenuItem>
          <MenuItem
            component={RouterLink}
            href={paths.dashboard.performance.evaluationResponsesView(row.assignmentId)}
            onClick={popover.onClose}
          >
            <Iconify icon="solar:eye-bold" />
            {t('evaluation-responses.actions.view')}
          </MenuItem>
          <MenuItem
            component={RouterLink}
            href={paths.dashboard.performance.evaluationMyResults(row.campaignId)}
            onClick={popover.onClose}
          >
            <Iconify icon="solar:file-text-bold" />
            {t('evaluation-responses.actions.viewResults')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
