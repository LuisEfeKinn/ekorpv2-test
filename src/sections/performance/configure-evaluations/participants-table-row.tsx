'use client';

import type { ICampaignParticipant } from 'src/types/performance';

import { useBoolean } from 'minimal-shared/hooks';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { fDateTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { ParticipantEvaluatorsDialog } from './participant-evaluators-dialog';

// ----------------------------------------------------------------------

type Props = {
  row: ICampaignParticipant;
  campaignId: string;
};

export function ParticipantsTableRow({ row, campaignId }: Props) {
  const { t } = useTranslate('performance');
  const evaluatorsDialog = useBoolean();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const translateStatus = (status: string) => {
    const translationKey = `campaign-participants.statuses.${status}`;
    return t(translationKey);
  };

  return (
    <>
      <TableRow hover tabIndex={-1}>
        <TableCell>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title={t('campaign-participants.actions.viewEvaluators')}>
              <IconButton color="default" onClick={evaluatorsDialog.onTrue}>
                <Iconify icon="solar:eye-bold" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Stack spacing={0.5} alignItems="flex-start">
            <Label variant="soft">{row.employee?.fullName || '-'}</Label>
          </Stack>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={getStatusColor(row.status)}>
            {translateStatus(row.status)}
          </Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row.createdAt ? fDateTime(row.createdAt) : '-'}
        </TableCell>
      </TableRow>

      <ParticipantEvaluatorsDialog
        open={evaluatorsDialog.value}
        onClose={evaluatorsDialog.onFalse}
        campaignId={campaignId}
        participantId={row.id}
        assignmentId={row.id}
        participantName={row.employee?.fullName || '-'}
      />
    </>
  );
}