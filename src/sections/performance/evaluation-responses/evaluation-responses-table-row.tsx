import type { IEvaluationResponse } from 'src/types/performance';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
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

export function EvaluationResponsesTableRow({ row }: Props) {
  const { t } = useTranslate('performance');

  const popover = usePopover();

  const relationshipLabels: { [key: string]: string } = {
    MANAGER: t('evaluation-responses.relationships.MANAGER'),
    PEER: t('evaluation-responses.relationships.PEER'),
    SUBORDINATE: t('evaluation-responses.relationships.SUBORDINATE'),
    SELF: t('evaluation-responses.relationships.SELF'),
    OTHER: t('evaluation-responses.relationships.OTHER'),
  };

  return (
    <>
      <TableRow hover>
        <TableCell padding="checkbox">
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        <TableCell>
          <Typography variant="subtitle2" noWrap>
            {row.campaignName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {t(`configure-evaluations.types.${row.campaignType}`)}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.participantName}
          </Typography>
        </TableCell>

        <TableCell>
          <Label variant="soft" color="default">
            {relationshipLabels[row.relationship] || row.relationship}
          </Label>
        </TableCell>

        <TableCell>
          <Typography variant="body2" color={new Date(row.deadline) < new Date() && !row.isCompleted ? 'error.main' : 'text.secondary'}>
            {fDate(row.deadline)}
          </Typography>
        </TableCell>

        <TableCell align="center">
          <Box sx={{ width: '100%', maxWidth: 80 }}>
            <Tooltip title={`${row.progress}%`}>
              <LinearProgress 
                variant="determinate" 
                value={row.progress} 
                color={row.progress === 100 ? 'success' : 'primary'}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Tooltip>
          </Box>
        </TableCell>

        <TableCell>
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
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
              // Aquí iría la lógica para ver o responder la evaluación
            }}
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
        </MenuList>
      </CustomPopover>
    </>
  );
}