'use client';

import type { IParticipantWithEvaluators } from 'src/types/performance';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  row: IParticipantWithEvaluators;
};

export function ParticipantsWithEvaluatorsTableRow({ row }: Props) {
  const { t } = useTranslate('performance');

  const translateRelationship = (relationship: string) => {
    const translationKey = `participants-with-evaluators.relationships.${relationship}`;
    return t(translationKey);
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'MANAGER':
        return 'primary';
      case 'PEER':
        return 'info';
      case 'SUBORDINATE':
        return 'warning';
      case 'SELF':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <TableRow hover tabIndex={-1}>
      {/* Nombre del Participante */}
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Stack spacing={0.5} alignItems="flex-start">
          <Label variant="soft" color="default">
            {row.employee?.fullName || '-'}
          </Label>
        </Stack>
      </TableCell>

      {/* Evaluadores */}
      <TableCell>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {row.evaluators && row.evaluators.length > 0 ? (
            row.evaluators.map((evaluator) => (
              <Tooltip
                key={evaluator.id}
                title={
                  <Box>
                    <Box>{translateRelationship(evaluator.relationship)}</Box>
                    <Box>
                      {evaluator.completed
                        ? t('participants-with-evaluators.completedYes')
                        : t('participants-with-evaluators.completedNo')}
                    </Box>
                  </Box>
                }
                arrow
              >
                <Label
                  variant="soft"
                  color={getRelationshipColor(evaluator.relationship)}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {evaluator.fullName || '-'}
                  {evaluator.completed && (
                    <Iconify
                      icon="eva:checkmark-circle-2-fill"
                      width={16}
                      sx={{ color: 'success.main' }}
                    />
                  )}
                </Label>
              </Tooltip>
            ))
          ) : (
            <Label variant="soft" color="warning">
              {t('participants-with-evaluators.noEvaluators')}
            </Label>
          )}
        </Stack>
      </TableCell>

      {/* Cantidad de Evaluadores */}
      <TableCell align="center">
        <Label variant="soft" color={row.evaluators?.length > 0 ? 'success' : 'warning'}>
          {row.evaluators?.length || 0}
        </Label>
      </TableCell>
    </TableRow>
  );
}
