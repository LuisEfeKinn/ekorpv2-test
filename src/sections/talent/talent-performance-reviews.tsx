import type { CardProps } from '@mui/material/Card';
import type { PerformanceReview } from 'src/_mock/_talent';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  tableData: PerformanceReview[];
};

export function TalentPerformanceReviews({ title, subheader, tableData, ...other }: Props) {
  const { t } = useTranslate('dashboard');

  return (
    <Card {...other}>
      <CardHeader 
        title={t('talent.performanceReviews.title')} 
        subheader={t('talent.performanceReviews.subtitle')} 
        sx={{ mb: 3 }} 
      />

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('talent.performanceReviews.employee')}</TableCell>
                <TableCell>{t('talent.performanceReviews.position')} / {t('talent.performanceReviews.department')}</TableCell>
                <TableCell align="center">{t('talent.performanceReviews.overallScore')}</TableCell>
                <TableCell>{t('talent.performanceReviews.productivity')}</TableCell>
                <TableCell>{t('talent.performanceReviews.quality')}</TableCell>
                <TableCell>{t('talent.performanceReviews.collaboration')}</TableCell>
                <TableCell>{t('talent.performanceReviews.lastReview')}</TableCell>
                <TableCell>{t('talent.performanceReviews.status')}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {tableData.map((row) => (
                <PerformanceRow key={row.id} row={row} />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}

// ----------------------------------------------------------------------

type PerformanceRowProps = {
  row: PerformanceReview;
};

function PerformanceRow({ row }: PerformanceRowProps) {
  const { t } = useTranslate('dashboard');

  const getStatusColor = (status: string) => {
    if (t(status) === t('talent.performanceReviews.statuses.excellent')) return 'success';
    if (t(status) === t('talent.performanceReviews.statuses.good')) return 'info';
    if (t(status) === t('talent.performanceReviews.statuses.regular')) return 'warning';
    return 'error';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={row.avatar} alt={row.employeeName} sx={{ mr: 2 }} />
          <Typography variant="subtitle2">{row.employeeName}</Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2">{row.position}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {row.department}
        </Typography>
      </TableCell>

      <TableCell align="center">
        <Box
          sx={{
            width: 56,
            height: 56,
            mx: 'auto',
            display: 'flex',
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            color: `${getScoreColor(row.overallScore)}.darker`,
            bgcolor: `${getScoreColor(row.overallScore)}.lighter`,
            fontWeight: 'fontWeightBold',
            fontSize: '1.1rem',
          }}
        >
          {row.overallScore}
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ minWidth: 120 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('talent.performanceReviews.productivity')}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {row.productivity}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={row.productivity}
            color={getScoreColor(row.productivity)}
            sx={{ height: 6, borderRadius: 1 }}
          />
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ minWidth: 120 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('talent.performanceReviews.quality')}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {row.quality}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={row.quality}
            color={getScoreColor(row.quality)}
            sx={{ height: 6, borderRadius: 1 }}
          />
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ minWidth: 120 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('talent.performanceReviews.collaboration')}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {row.collaboration}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={row.collaboration}
            color={getScoreColor(row.collaboration)}
            sx={{ height: 6, borderRadius: 1 }}
          />
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2">{fDate(row.lastReview)}</Typography>
      </TableCell>

      <TableCell>
        <Label variant="soft" color={getStatusColor(row.status)}>
          {t(row.status)}
        </Label>
      </TableCell>
    </TableRow>
  );
}
