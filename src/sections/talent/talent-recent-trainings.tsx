import type { CardProps } from '@mui/material/Card';
import type { Training } from 'src/_mock/_talent';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import TableContainer from '@mui/material/TableContainer';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  tableData: Training[];
};

export function TalentRecentTrainings({ title, subheader, tableData, ...other }: Props) {
  const { t } = useTranslate('dashboard');

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('talent.recentTrainings.employee')}</TableCell>
                <TableCell>{t('talent.recentTrainings.course')}</TableCell>
                <TableCell>{t('talent.recentTrainings.date')}</TableCell>
                <TableCell>{t('talent.recentTrainings.status')}</TableCell>
                <TableCell align="center">{t('talent.recentTrainings.score')}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {tableData.map((row) => (
                <TrainingRow key={row.id} row={row} />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}

// ----------------------------------------------------------------------

type TrainingRowProps = {
  row: Training;
};

function TrainingRow({ row }: TrainingRowProps) {
  const { t } = useTranslate('dashboard');

  const getStatusColor = (status: string) => {
    if (status === 'talent.recentTrainings.statuses.completed') return 'success';
    if (status === 'talent.recentTrainings.statuses.inProgress') return 'warning';
    return 'default';
  };

  const getStatusTranslation = (status: string) => {
    if (status === 'talent.recentTrainings.statuses.completed') return t('talent.recentTrainings.statuses.completed');
    if (status === 'talent.recentTrainings.statuses.inProgress') return t('talent.recentTrainings.statuses.inProgress');
    return t('talent.recentTrainings.statuses.pending');
  };

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={row.avatar} alt={row.employeeName} sx={{ mr: 2 }} />
          {row.employeeName}
        </Box>
      </TableCell>

      <TableCell>{row.course}</TableCell>

      <TableCell>{fDate(row.completedDate)}</TableCell>

      <TableCell>
        <Label variant="soft" color={getStatusColor(row.status)}>
          {getStatusTranslation(row.status)}
        </Label>
      </TableCell>

      <TableCell align="center">
        {row.status === 'talent.recentTrainings.statuses.completed' ? (
          <Box
            sx={{
              width: 40,
              height: 40,
              mx: 'auto',
              display: 'flex',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'success.darker',
              bgcolor: 'success.lighter',
              fontWeight: 'fontWeightBold',
            }}
          >
            {row.score}
          </Box>
        ) : (
          '-'
        )}
      </TableCell>
    </TableRow>
  );
}
