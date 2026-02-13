import type { CardProps } from '@mui/material/Card';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Label, labelClasses } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  tableData: {
    id: string;
    name: string;
    progress: number;
    totalCourses: number;
    completedCourses: number;
    status: string;
    courses: {
      id: string;
      name: string;
      status: string;
      startDate: string | null;
      score: number | null;
      duration: string;
      progress?: number;
    }[];
  }[];
};

export function PersonalCoursesTable({ title, subheader, tableData, ...other }: Props) {
  const { t } = useTranslate('dashboard');

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar sx={{ minWidth: 720 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={40} />
                <TableCell>{t('personal.courses.headers.learningPath')}</TableCell>
                <TableCell>{t('personal.courses.headers.progress')}</TableCell>
                <TableCell>{t('personal.courses.headers.courses')}</TableCell>
                <TableCell>{t('personal.courses.headers.status')}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {tableData.map((row) => (
                <LearningPathRow key={row.id} row={row} />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}

// ----------------------------------------------------------------------

type LearningPathRowProps = {
  row: Props['tableData'][0];
};

function LearningPathRow({ row }: LearningPathRowProps) {
  const theme = useTheme();
  const collapse = useBoolean();
  const { t } = useTranslate('dashboard');

  const renderPrimary = (
    <TableRow hover>
      <TableCell>
        <IconButton
          size="small"
          color={collapse.value ? 'inherit' : 'default'}
          onClick={collapse.onToggle}
        >
          <Iconify
            icon={collapse.value ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
          />
        </IconButton>
      </TableCell>

      <TableCell>
        <Box sx={{ maxWidth: 280 }}>
          <Box component="span" sx={{ typography: 'subtitle2' }}>
            {row.name}
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ width: 160 }}>
          <Box sx={{ typography: 'caption', color: 'text.secondary', mb: 1 }}>
            {row.progress}% completado
          </Box>
          <LinearProgress
            value={row.progress}
            variant="determinate"
            color={
              (row.progress < 30 && 'error') ||
              (row.progress < 70 && 'warning') ||
              'success'
            }
            sx={{ height: 6, bgcolor: alpha(theme.palette.grey[500], 0.16) }}
          />
        </Box>
      </TableCell>

      <TableCell>
        <Box sx={{ typography: 'body2' }}>
          {row.completedCourses} de {row.totalCourses}
        </Box>
      </TableCell>

      <TableCell>
        <Label
          variant="soft"
          color={
            (row.status === 'completed' && 'success') ||
            (row.status === 'inProgress' && 'warning') ||
            'default'
          }
        >
          {row.status === 'completed' ? t('personal.courses.statuses.completed') : 
           row.status === 'inProgress' ? t('personal.courses.statuses.inProgress') : 
           t('personal.courses.statuses.notStarted')}
        </Label>
      </TableCell>
    </TableRow>
  );

  const renderSecondary = (
    <TableRow>
      <TableCell sx={{ p: 0, border: 'none' }} colSpan={8}>
        <Collapse in={collapse.value} unmountOnExit>
          <Box sx={{ bgcolor: 'background.neutral', p: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 12 }}>{t('personal.courses.headers.course')}</TableCell>
                  <TableCell>{t('personal.courses.headers.status')}</TableCell>
                  <TableCell>{t('personal.courses.headers.startDate')}</TableCell>
                  <TableCell>{t('personal.courses.headers.score')}</TableCell>
                  <TableCell>{t('personal.courses.headers.duration')}</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {row.courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell sx={{ typography: 'body2', pl: 12 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            height: 1, 
                            bgcolor: 'divider', 
                            borderRadius: 0.5 
                          }} 
                        />
                        {course.name}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Label
                        variant="soft"
                        color={
                          (course.status === 'completed' && 'success') ||
                          (course.status === 'inProgress' && 'warning') ||
                          'default'
                        }
                        sx={{
                          [`& .${labelClasses.root}`]: { 
                            textTransform: 'capitalize',
                            fontSize: '0.75rem'
                          }
                        }}
                      >
                        {course.status === 'completed' ? t('personal.courses.statuses.completed') : 
                         course.status === 'inProgress' ? t('personal.courses.statuses.inProgress') : 
                         t('personal.courses.statuses.pending')}
                      </Label>
                    </TableCell>

                    <TableCell sx={{ typography: 'body2' }}>
                      {course.startDate ? fDate(course.startDate) : t('personal.courses.statuses.notStarted')}
                    </TableCell>

                    <TableCell>
                      <Box sx={{ typography: 'body2' }}>
                        {course.score ? `${course.score}/100` : '-'}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ typography: 'body2' }}>
                      {course.duration}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      {renderPrimary}
      {renderSecondary}
    </>
  );
}