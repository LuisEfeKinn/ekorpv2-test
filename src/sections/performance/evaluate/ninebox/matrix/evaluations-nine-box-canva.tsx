'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';

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

type NineBoxData = {
  campaignId: string;
  campaignName: string;
  boxes: BoxData[];
};

type Props = {
  data: NineBoxData;
};

// ----------------------------------------------------------------------

export function EvaluationsNineBoxCanva({ data }: Props) {
  const theme = useTheme();
  const { t } = useTranslate('performance');

  // Organizar las cajas en el orden correcto para el grid 3x3
  const orderedBoxes = useMemo(() => {
    const boxOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    return boxOrder.map((boxNum) => 
      data.boxes.find((box) => box.boxNumber === boxNum)
    ).filter(Boolean) as BoxData[];
  }, [data.boxes]);

  // Organizar en grid 3x3
  const gridBoxes = [
    [orderedBoxes[0], orderedBoxes[3], orderedBoxes[6]], // Fila 1: 1, 4, 7
    [orderedBoxes[1], orderedBoxes[4], orderedBoxes[7]], // Fila 2: 2, 5, 8
    [orderedBoxes[2], orderedBoxes[5], orderedBoxes[8]], // Fila 3: 3, 6, 9
  ];

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

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
      enterDelay={200}
      leaveDelay={100}
    >
      <Box
        sx={{
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1, sm: 1.25 },
          borderRadius: 1.5,
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: 0,
            bgcolor: boxColor,
            borderRadius: '0 2px 2px 0',
            transition: 'height 0.25s ease',
          },
          '&:hover': {
            bgcolor: alpha(boxColor, 0.08),
            transform: 'translateX(4px)',
            '&::before': {
              height: '70%',
            },
          },
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600,
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            color: 'text.primary',
            lineHeight: 1.5,
          }}
        >
          {employee.fullName}
        </Typography>
      </Box>
    </Tooltip>
  );

  const renderBox = (box: BoxData) => (
    <Card
      key={box.boxNumber}
      sx={{
        height: '100%',
        minHeight: { xs: 280, sm: 320, md: 350 },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        border: `2px solid ${alpha(box.colorCode, 0.15)}`,
        borderRadius: 2.5,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: `0 12px 24px ${alpha(box.colorCode, 0.25)}`,
          transform: 'translateY(-8px)',
          borderColor: alpha(box.colorCode, 0.4),
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, ${box.colorCode} 0%, ${alpha(box.colorCode, 0.7)} 100%)`,
          transition: 'height 0.3s ease',
        },
        '&:hover::before': {
          height: 8,
        },
      }}
    >
      {/* Header profesional con gradiente */}
      <Box 
        sx={{ 
          background: `linear-gradient(135deg, ${alpha(box.colorCode, 0.08)} 0%, ${alpha(box.colorCode, 0.03)} 100%)`,
          p: { xs: 2, sm: 2.5, md: 3 },
          pb: { xs: 1.5, sm: 2 },
          borderBottom: `1px solid ${alpha(box.colorCode, 0.1)}`,
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
              letterSpacing: 0.5,
              color: box.colorCode,
              lineHeight: 1.3,
              textTransform: 'uppercase',
              flex: 1,
            }}
          >
            {box.label}
          </Typography>
          <Chip
            label={box.employees.length}
            sx={{
              bgcolor: box.colorCode,
              color: theme.palette.getContrastText(box.colorCode),
              fontWeight: 800,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              height: { xs: 24, sm: 28 },
              minWidth: { xs: 32, sm: 40 },
              '& .MuiChip-label': {
                px: { xs: 1, sm: 1.5 },
              },
            }}
          />
        </Stack>

        {/* Avatares agrupados con mejor diseño */}
        {box.employees.length > 0 && (
          <Stack 
            direction="row" 
            sx={{ 
              position: 'relative',
              height: { xs: 36, sm: 40, md: 44 },
              mb: 1.5,
            }}
          >
            {box.employees.slice(0, 6).map((employee, index) => (
              <Tooltip 
                key={employee.participantId} 
                title={
                  <Box sx={{ py: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {employee.fullName}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ opacity: 0.8, fontSize: '0.65rem' }}>
                      {employee.jobTitle}
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <Avatar
                  sx={{
                    position: 'absolute',
                    left: index * 28,
                    width: { xs: 36, sm: 40, md: 44 },
                    height: { xs: 36, sm: 40, md: 44 },
                    bgcolor: box.colorCode,
                    color: theme.palette.getContrastText(box.colorCode),
                    border: `3px solid ${theme.palette.background.paper}`,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 2px 8px ${alpha(box.colorCode, 0.3)}`,
                    zIndex: 10 - index,
                    '&:hover': {
                      transform: 'translateY(-4px) scale(1.1)',
                      zIndex: 20,
                      boxShadow: `0 4px 12px ${alpha(box.colorCode, 0.5)}`,
                    },
                  }}
                >
                  {getInitials(employee.fullName)}
                </Avatar>
              </Tooltip>
            ))}
            {box.employees.length > 6 && (
              <Avatar
                sx={{
                  position: 'absolute',
                  left: 6 * 28,
                  width: { xs: 36, sm: 40, md: 44 },
                  height: { xs: 36, sm: 40, md: 44 },
                  bgcolor: alpha(box.colorCode, 0.15),
                  color: box.colorCode,
                  border: `3px solid ${theme.palette.background.paper}`,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  fontWeight: 800,
                  boxShadow: `0 2px 8px ${alpha(box.colorCode, 0.2)}`,
                }}
              >
                +{box.employees.length - 6}
              </Avatar>
            )}
          </Stack>
        )}

        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {box.employees.length} {box.employees.length === 1 ? 'empleado' : 'empleados'}
        </Typography>
      </Box>

      {/* Lista de nombres con diseño mejorado */}
      <Box
        sx={{
          px: { xs: 2, sm: 2.5, md: 3 },
          pb: { xs: 2, sm: 2.5, md: 3 },
          pt: { xs: 1.5, sm: 2 },
          flex: 1,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha(box.colorCode, 0.05),
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(box.colorCode, 0.3),
            borderRadius: 3,
            '&:hover': {
              backgroundColor: alpha(box.colorCode, 0.5),
            },
          },
        }}
      >
        {box.employees.length > 0 ? (
          <Stack spacing={{ xs: 0.75, sm: 1 }}>
            {box.employees.map((employee, index) => (
              <Box
                key={employee.participantId}
                sx={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                  '@keyframes fadeInUp': {
                    from: {
                      opacity: 0,
                      transform: 'translateY(10px)',
                    },
                    to: {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                }}
              >
                {renderEmployee(employee, box.colorCode)}
              </Box>
            ))}
          </Stack>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: { xs: 120, sm: 140 },
              py: 3,
            }}
          >
            <Box
              sx={{
                width: { xs: 56, sm: 64 },
                height: { xs: 56, sm: 64 },
                borderRadius: '50%',
                bgcolor: alpha(box.colorCode, 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: alpha(box.colorCode, 0.3),
                  fontWeight: 300,
                }}
              >
                —
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              color="text.disabled"
              sx={{ 
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                fontStyle: 'italic',
                fontWeight: 500,
              }}
            >
              {t('nine-box.noParticipants')}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );

  return (
    <Box>
      {/* Grid 3x3 del Nine Box con labels de ejes profesionales */}
      <Box sx={{ position: 'relative', pl: { xs: 0, lg: 10 }, pt: { xs: 2, md: 3 } }}>
        {/* Label vertical POTENCIAL con diseño mejorado */}
        <Box
          sx={{
            position: 'absolute',
            left: { lg: 8 },
            top: '50%',
            transform: 'translateY(-50%) rotate(-90deg)',
            transformOrigin: 'center',
            display: { xs: 'none', lg: 'block' },
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 4,
                height: 40,
                bgcolor: 'primary.main',
                borderRadius: 2,
              }}
            />
            <Typography
              variant="overline"
              sx={{
                fontWeight: 800,
                fontSize: '0.875rem',
                color: 'text.primary',
                letterSpacing: 2.5,
              }}
            >
              {t('nine-box.potentialLabel').toUpperCase()}
            </Typography>
          </Stack>
        </Box>

        {/* Grid con mejor espaciado responsive */}
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {gridBoxes.map((row, rowIndex) =>
            row.map((box, colIndex) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={box?.boxNumber || `${rowIndex}-${colIndex}`}>
                {box && renderBox(box)}
              </Grid>
            ))
          )}
        </Grid>

        {/* Label horizontal DESEMPEÑO con diseño mejorado */}
        <Box
          sx={{
            mt: { xs: 3, md: 4 },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 4,
                bgcolor: 'primary.main',
                borderRadius: 2,
              }}
            />
            <Typography
              variant="overline"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                color: 'text.primary',
                letterSpacing: 2.5,
              }}
            >
              {t('nine-box.performanceLabel').toUpperCase()}
            </Typography>
            <Box
              sx={{
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <Typography
                sx={{
                  fontSize: '1rem',
                  color: 'primary.main',
                  fontWeight: 700,
                }}
              >
                →
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
