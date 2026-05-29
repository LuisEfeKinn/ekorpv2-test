'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Employee = {
  participantId: string;
  employeeId: string;
  fullName: string;
  jobTitle: string;
  xScore: number;
  yScore: number;
};

type BoxData = {
  boxNumber: number;
  label: string;
  colorCode: string;
  employees: Employee[];
};

type NineBoxHistoryData = {
  campaignId: string;
  campaignName: string;
  boxes: BoxData[];
};

type Props = {
  data: NineBoxHistoryData;
};

// ----------------------------------------------------------------------

export function EvaluationNineBoxHistory({ data }: Props) {
  const theme = useTheme();
  const { t } = useTranslate('performance');

  // Organizar las cajas en orden correcto para el grid 3x3 (invertido verticalmente)
  const orderedBoxes = useMemo(() => {
    const boxOrder = [3, 2, 1, 6, 5, 4, 9, 8, 7];
    return boxOrder.map((boxNum) => 
      data.boxes.find((box) => box.boxNumber === boxNum)
    ).filter(Boolean) as BoxData[];
  }, [data.boxes]);

  // Organizar en grid 3x3
  const gridBoxes = [
    [orderedBoxes[0], orderedBoxes[1], orderedBoxes[2]], // Fila 1: 3, 2, 1
    [orderedBoxes[3], orderedBoxes[4], orderedBoxes[5]], // Fila 2: 6, 5, 4
    [orderedBoxes[6], orderedBoxes[7], orderedBoxes[8]], // Fila 3: 9, 8, 7
  ];

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const getTotalEmployees = useMemo(
    () => data.boxes.reduce((total, box) => total + box.employees.length, 0),
    [data.boxes]
  );

  const renderEmployee = (employee: Employee, boxColor: string) => (
    <Tooltip
      key={employee.participantId}
      title={
        <Box sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {employee.fullName}
          </Typography>
          <Typography variant="caption" display="block" sx={{ color: 'grey.300', mb: 1.5, lineHeight: 1.4 }}>
            {employee.jobTitle}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip 
              label={`${t('nine-box.performance')}: ${employee.xScore}`} 
              size="small" 
              sx={{ 
                height: 22, 
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            />
            <Chip 
              label={`${t('nine-box.potential')}: ${employee.yScore}`} 
              size="small" 
              sx={{ 
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
              }}
            />
          </Stack>
        </Box>
      }
      arrow
      placement="top"
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: boxColor,
          color: theme.palette.getContrastText(boxColor),
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          border: `2px solid ${theme.palette.background.paper}`,
          boxShadow: theme.shadows[2],
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.15)',
            boxShadow: theme.shadows[8],
            zIndex: 10,
          },
        }}
      >
        {getInitials(employee.fullName)}
      </Avatar>
    </Tooltip>
  );

  const renderEmployeeGroup = (employees: Employee[], boxColor: string, maxVisible: number = 6) => {
    if (employees.length === 0) {
      return (
        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
          {t('nine-box.noParticipants')}
        </Typography>
      );
    }

    const visibleEmployees = employees.slice(0, maxVisible);
    const remainingCount = employees.length - maxVisible;

    return (
      <Stack direction="row" spacing={-1} flexWrap="wrap" useFlexGap>
        {visibleEmployees.map((employee) => renderEmployee(employee, boxColor))}
        {remainingCount > 0 && (
          <Tooltip
            title={
              <Box sx={{ p: 1 }}>
                {employees.slice(maxVisible).map((emp) => (
                  <Typography key={emp.participantId} variant="caption" display="block" sx={{ mb: 0.5 }}>
                    • {emp.fullName}
                  </Typography>
                ))}
              </Box>
            }
            arrow
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: alpha(theme.palette.grey[900], 0.72),
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: `2px solid ${theme.palette.background.paper}`,
              }}
            >
              +{remainingCount}
            </Avatar>
          </Tooltip>
        )}
      </Stack>
    );
  };

  const renderBox = (box: BoxData | undefined) => {
    if (!box) return null;

    return (
      <Card
        key={box.boxNumber}
        sx={{
          height: 240,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          border: `3px solid ${box.colorCode}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: theme.shadows[12],
            transform: 'translateY(-2px)',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: box.colorCode,
            p: 2,
            pb: 1.5,
            borderBottom: `2px solid ${alpha(box.colorCode, 0.3)}`,
          }}
        >
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Stack spacing={0.5} flex={1}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 800, 
                  fontSize: '0.65rem',
                  color: theme.palette.getContrastText(box.colorCode),
                  opacity: 0.7,
                }}
              >
                {t('nine-box.quadrant')} #{box.boxNumber}
              </Typography>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  lineHeight: 1.3,
                  color: theme.palette.getContrastText(box.colorCode),
                }}
              >
                {box.label}
              </Typography>
            </Stack>
            <Chip
              label={box.employees.length}
              size="small"
              sx={{
                height: 24,
                minWidth: 32,
                bgcolor: theme.palette.getContrastText(box.colorCode),
                color: box.colorCode,
                fontWeight: 800,
                fontSize: '0.75rem',
              }}
            />
          </Stack>
        </Box>

        {/* Content - Employees */}
        <Box 
          sx={{ 
            p: 2,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(box.colorCode, 0.04),
          }}
        >
          {renderEmployeeGroup(box.employees, box.colorCode)}
        </Box>
      </Card>
    );
  };

  return (
    <Stack spacing={3}>
      {/* Statistics Card */}
      <Card 
        sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.16),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="solar:users-group-rounded-bold" width={32} color="info.main" />
            </Box>
            <Box flex={1}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'info.main' }}>
                {getTotalEmployees}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('nine-box.history.totalParticipants')}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Card>

      {/* Nine Box Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
          position: 'relative',
        }}
      >
        {/* Potential Axis Label (Vertical) */}
        <Box
          sx={{
            position: 'absolute',
            left: -60,
            top: '50%',
            transform: 'translateY(-50%) rotate(-90deg)',
            transformOrigin: 'center',
            zIndex: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="eva:arrow-upward-fill" width={20} color="text.secondary" />
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 800,
                color: 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
              {t('nine-box.potentialAxis')}
            </Typography>
          </Stack>
        </Box>

        {/* Performance Axis Label (Horizontal) */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 800,
                color: 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
              {t('nine-box.performanceAxis')}
            </Typography>
            <Iconify icon="eva:arrow-forward-fill" width={20} color="text.secondary" />
          </Stack>
        </Box>

        {/* Grid Boxes */}
        {gridBoxes.map((row, rowIndex) => (
          row.map((box, colIndex) => (
            <Box key={`${rowIndex}-${colIndex}`}>
              {renderBox(box)}
            </Box>
          ))
        ))}
      </Box>
    </Stack>
  );
}
