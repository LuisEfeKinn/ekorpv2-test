import 'react-vertical-timeline-component/style.min.css';

import { useState } from 'react';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

type DependencyRegister = {
  id: number;
  name: string;
};

type Dependency = {
  type: string;
  registers: DependencyRegister[];
};

type TimelineItem = {
  id: number;
  name: string;
  adoptionContractDate: string;
  expirationDate: string;
  renewalDate: string;
  obsolescenceDate: string;
  color: string;
  dependencies: Dependency[];
};

type Props = {
  data: TimelineItem[];
  field: 'renewal' | 'expired' | 'obsolescence';
  loading?: boolean;
};

export function ApplicationTimeline({ data, field, loading }: Props) {
  const theme = useTheme();
  const { t } = useTranslate('architecture');
  const [datesAnchorEl, setDatesAnchorEl] = useState<HTMLElement | null>(null);
  const [dependenciesAnchorEl, setDependenciesAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  const handleOpenDatesPopover = (event: React.MouseEvent<HTMLElement>, item: TimelineItem) => {
    event.stopPropagation();
    setDatesAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleCloseDatesPopover = () => {
    setDatesAnchorEl(null);
    setSelectedItem(null);
  };

  const handleOpenDependenciesPopover = (event: React.MouseEvent<HTMLElement>, item: TimelineItem) => {
    event.stopPropagation();
    setDependenciesAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleCloseDependenciesPopover = () => {
    setDependenciesAnchorEl(null);
    setSelectedItem(null);
  };

  const openDates = Boolean(datesAnchorEl);
  const openDependencies = Boolean(dependenciesAnchorEl);

  if (loading) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('application.timeline.messages.loading')}
        </Typography>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card sx={{ p: 3 }}>
        <EmptyContent
          filled
          title={t('application.timeline.emptyState.title')}
          description={t('application.timeline.emptyState.description')}
          sx={{ py: 10 }}
        />
      </Card>
    );
  }

  const getDateByField = (item: TimelineItem): string => {
    switch (field) {
      case 'renewal':
        return item.renewalDate;
      case 'expired':
        return item.expirationDate;
      case 'obsolescence':
        return item.obsolescenceDate;
      default:
        return item.adoptionContractDate;
    }
  };

  const getDateLabel = (): string => {
    switch (field) {
      case 'renewal':
        return t('application.timeline.labels.renewalDate');
      case 'expired':
        return t('application.timeline.labels.expirationDate');
      case 'obsolescence':
        return t('application.timeline.labels.obsolescenceDate');
      default:
        return t('application.timeline.labels.adoptionDate');
    }
  };

  // Sort data by date
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(getDateByField(a)).getTime();
    const dateB = new Date(getDateByField(b)).getTime();
    if (dateA === dateB) {
      return a.id - b.id; // Secondary sort by ID if dates are equal
    }
    return dateA - dateB;
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'background.default',
        borderRadius: 3,
        p: 4,
        '& .vertical-timeline': {
          width: '100%',
          maxWidth: '100%',
          padding: '0 !important',
          margin: '0 !important',
          '&::before': {
            background: `linear-gradient(180deg, ${theme.palette.primary.main}20 0%, ${theme.palette.primary.main}60 50%, ${theme.palette.primary.main}20 100%)`,
            width: '3px',
            left: '50% !important',
            transform: 'translateX(-50%)',
            boxShadow: `0 0 8px ${theme.palette.primary.main}40`,
          },
        },
        '& .vertical-timeline-element': {
          margin: '1.5em 0',
        },
        '& .vertical-timeline-element-content': {
          boxShadow: 'none',
          borderRadius: '16px',
          padding: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginLeft: 0,
          background: 'transparent',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        '& .vertical-timeline-element-content-arrow': {
          display: 'none',
        },
        '& .vertical-timeline-element-date': {
          display: 'none !important',
        },
        '& .vertical-timeline-element-icon': {
          width: '24px',
          height: '24px',
          left: '50% !important',
          marginLeft: '-12px !important',
          boxShadow: 'none !important',
        },
      }}
    >
      <Box
        sx={{
          mb: 4,
          pb: 3,
          borderBottom: `2px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {getDateLabel()}
          </Typography>
          <Chip
            label={`${sortedData.length} ${sortedData.length === 1 ? 'elemento' : 'elementos'}`}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontWeight: 700,
              height: 32,
              '& .MuiChip-label': {
                px: 2,
              },
            }}
          />
        </Box>
      </Box>

      <VerticalTimeline layout="2-columns" lineColor={theme.palette.divider}>
        {sortedData.map((item, index) => {
          const dateValue = getDateByField(item);

          return (
            <VerticalTimelineElement
              key={`timeline-${item.id}-${index}-${dateValue}`}
              date={formatDate(dateValue)}
              contentStyle={{
                background: 'transparent',
                color: theme.palette.text.primary,
                border: 'none',
                borderLeft: 'none',
                boxShadow: 'none',
                padding: 0,
              }}
              iconStyle={{
                background: item.color,
                border: `4px solid ${theme.palette.background.paper}`,
                boxShadow: `0 0 0 3px ${item.color}40, 0 0 12px ${item.color}30`,
              }}
              icon={<Box />}
            >
              <Card
                sx={{
                  px: 1.2,
                  py: 1,
                  borderRadius: '10px',
                  borderLeft: `3px solid ${item.color}`,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  borderRight: `1px solid ${theme.palette.divider}`,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: 'background.paper',
                  boxShadow: theme.palette.mode === 'dark'
                    ? `0 8px 32px rgba(0,0,0,0.6)`
                    : `0 8px 32px rgba(0,0,0,0.12)`,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${item.color}05 0%, transparent 50%)`
                    : `linear-gradient(135deg, ${item.color}03 0%, transparent 50%)`,
                }}
              >
                <Stack spacing={0.75}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: { xs: 0.75, sm: 1 }, flexWrap: 'wrap' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        m: 0,
                        mt: { xs: 1, sm: 0 },
                        fontSize: { xs: '0.8rem', sm: '0.85rem' },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        letterSpacing: '-0.01em',
                        wordBreak: 'break-word',
                        flex: { xs: '1 1 100%', sm: '1 1 auto' },
                        minWidth: 0,
                        maxWidth: { xs: '100%', sm: 'calc(100% - 80px)' },
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: item.color,
                          flexShrink: 0,
                          boxShadow: `0 0 0 3px ${item.color}20, 0 0 12px ${item.color}40`,
                          animation: 'pulse 3s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': {
                              boxShadow: `0 0 0 3px ${item.color}20, 0 0 12px ${item.color}40`,
                              transform: 'scale(1)',
                            },
                            '50%': {
                              boxShadow: `0 0 0 4px ${item.color}30, 0 0 16px ${item.color}60`,
                              transform: 'scale(1.1)',
                            },
                          },
                        }}
                      />
                      {item.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label={`ID: ${item.id}`}
                        size="small"
                        sx={{
                          height: 20,
                          bgcolor: theme.palette.mode === 'dark'
                            ? `${item.color}20`
                            : `${item.color}15`,
                          color: item.color,
                          fontWeight: 600,
                          fontSize: '0.65rem',
                          border: `1px solid ${item.color}40`,
                          backdropFilter: 'blur(10px)',
                          '& .MuiChip-label': {
                            px: 0.75,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                  
                  {/* Date display integrated */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'baseline', 
                      gap: 0.75,
                      pt: 0.75,
                      mt: 0.5,
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        lineHeight: 1,
                      }}
                    >
                      {getDateLabel()}:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        lineHeight: 1,
                      }}
                    >
                      {formatDate(dateValue)}
                    </Typography>
                  </Box>

                  {/* Action buttons */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      gap: 0.5,
                      pt: 0.75,
                      mt: 0.5,
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Chip
                      icon={<Iconify icon="solar:calendar-date-bold" width={14} />}
                      label="Fechas"
                      size="small"
                      onClick={(e) => handleOpenDatesPopover(e, item)}
                      sx={{
                        height: 24,
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    />
                    <Chip
                      icon={<Iconify icon="eva:link-2-fill" width={14} />}
                      label="Dependencias"
                      size="small"
                      onClick={(e) => handleOpenDependenciesPopover(e, item)}
                      sx={{
                        height: 24,
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'secondary.main',
                          color: 'secondary.contrastText',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </Card>
            </VerticalTimelineElement>
          );
        })}
      </VerticalTimeline>

      {/* Popover with dates */}
      <Popover
        open={openDates}
        anchorEl={datesAnchorEl}
        onClose={handleCloseDatesPopover}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              boxShadow: theme.shadows[24],
              minWidth: { xs: 'calc(100vw - 32px)', sm: 400 },
              maxWidth: { xs: 'calc(100vw - 32px)', sm: 500 },
              width: { xs: 'calc(100vw - 32px)', sm: 'auto' },
            },
          },
        }}
      >
        {selectedItem && (
          <Box sx={{ p: { xs: 2, sm: 3 }, position: 'relative' }}>
            <IconButton
              onClick={handleCloseDatesPopover}
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: 1 },
                right: { xs: 8, sm: 1 },
                zIndex: 1,
                bgcolor: 'action.hover',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <Iconify icon="solar:close-circle-bold" width={20} />
            </IconButton>

            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 1.5 }, 
                mb: 3,
                pb: 2,
                pr: { xs: 5, sm: 0 },
                borderBottom: `2px solid ${selectedItem.color}30`,
                flexWrap: 'wrap',
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: selectedItem.color,
                  boxShadow: `0 0 0 4px ${selectedItem.color}20`,
                  flexShrink: 0,
                }}
              />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'text.primary',
                  fontSize: { xs: '0.95rem', sm: '1.25rem' },
                  wordBreak: 'break-word',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {selectedItem.name}
              </Typography>
              <Chip
                label={`ID: ${selectedItem.id}`}
                size="small"
                sx={{
                  bgcolor: `${selectedItem.color}15`,
                  color: selectedItem.color,
                  fontWeight: 700,
                  border: `1px solid ${selectedItem.color}40`,
                  flexShrink: 0,
                }}
              />
            </Box>

            <Stack spacing={{ xs: 1.5, sm: 2 }}>
              <Box 
                sx={{ 
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'action.hover' : 'action.selected',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    display: 'block',
                    mb: 0.75,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {t('application.timeline.labels.adoptionDate')}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 800,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  }}
                >
                  {formatDate(selectedItem.adoptionContractDate)}
                </Typography>
              </Box>

              <Box 
                sx={{ 
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'action.hover' : 'action.selected',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    display: 'block',
                    mb: 0.75,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {t('application.timeline.labels.expirationDate')}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 800,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  }}
                >
                  {formatDate(selectedItem.expirationDate)}
                </Typography>
              </Box>

              <Box 
                sx={{ 
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'action.hover' : 'action.selected',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    display: 'block',
                    mb: 0.75,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {t('application.timeline.labels.renewalDate')}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 800,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  }}
                >
                  {formatDate(selectedItem.renewalDate)}
                </Typography>
              </Box>

              <Box 
                sx={{ 
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'action.hover' : 'action.selected',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    display: 'block',
                    mb: 0.75,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {t('application.timeline.labels.obsolescenceDate')}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 800,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  }}
                >
                  {formatDate(selectedItem.obsolescenceDate)}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Popover>

      {/* Popover with dependencies */}
      <Popover
        open={openDependencies}
        anchorEl={dependenciesAnchorEl}
        onClose={handleCloseDependenciesPopover}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              boxShadow: theme.shadows[24],
              minWidth: { xs: 'calc(100vw - 32px)', sm: 400 },
              maxWidth: { xs: 'calc(100vw - 32px)', sm: 600 },
              width: { xs: 'calc(100vw - 32px)', sm: 'auto' },
            },
          },
        }}
      >
        {selectedItem && (
          <Box sx={{ p: { xs: 2, sm: 3 }, position: 'relative' }}>
            <IconButton
              onClick={handleCloseDependenciesPopover}
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: 1 },
                right: { xs: 8, sm: 1 },
                zIndex: 1,
                bgcolor: 'action.hover',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <Iconify icon="solar:close-circle-bold" width={20} />
            </IconButton>

            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 1.5 }, 
                mb: 3,
                pb: 2,
                pr: { xs: 5, sm: 0 },
                borderBottom: `2px solid ${selectedItem.color}30`,
                flexWrap: 'wrap',
              }}
            >
              <Iconify icon="eva:link-2-fill" sx={{ width: { xs: 18, sm: 20 }, color: selectedItem.color, flexShrink: 0 }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'text.primary',
                  fontSize: { xs: '0.95rem', sm: '1.25rem' },
                  wordBreak: 'break-word',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {t('application.timeline.labels.dependencies')} {selectedItem.name}
              </Typography>
              <Chip
                label={`${selectedItem.dependencies?.length || 0} ${(selectedItem.dependencies?.length || 0) === 1 ? t('application.timeline.labels.dependenciesSingular') : t('application.timeline.labels.dependenciesPlural')}`}
                size="small"
                sx={{
                  bgcolor: `${selectedItem.color}15`,
                  color: selectedItem.color,
                  fontWeight: 700,
                  border: `1px solid ${selectedItem.color}40`,
                  flexShrink: 0,
                }}
              />
            </Box>

            <Stack spacing={{ xs: 1.5, sm: 2 }}>
              {(!selectedItem.dependencies || selectedItem.dependencies.length === 0) ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'action.hover' : 'action.selected',
                    border: `1px dashed ${theme.palette.divider}`,
                  }}
                >
                  <Iconify 
                    icon="eva:link-2-fill" 
                    width={48} 
                    sx={{ 
                      color: 'text.disabled',
                      mb: 2,
                    }} 
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 600,
                    }}
                  >
                    {t('application.timeline.labels.noDependencies')}
                  </Typography>
                </Box>
              ) : (
                selectedItem.dependencies.map((dependency, idx) => (
                  <Box key={idx}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 1.5,
                        fontWeight: 700,
                        color: 'text.primary',
                        textTransform: 'capitalize',
                        fontSize: { xs: '0.85rem', sm: '0.875rem' },
                      }}
                    >
                      {t('application.timeline.labels.type')}: {dependency.type}
                    </Typography>
                    <Stack spacing={{ xs: 0.75, sm: 1 }}>
                      {dependency.registers.map((register) => (
                        <Box
                          key={register.id}
                          sx={{
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: 2,
                            bgcolor: theme.palette.mode === 'dark' ? 'action.hover' : 'action.selected',
                            border: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 1.5, sm: 2 },
                            flexWrap: 'wrap',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' ? 'action.selected' : 'action.hover',
                              transform: 'translateX(4px)',
                            },
                          }}
                        >
                          <Chip
                            label={`ID: ${register.id}`}
                            size="small"
                            sx={{
                              bgcolor: `${selectedItem.color}15`,
                              color: selectedItem.color,
                              fontWeight: 600,
                              fontSize: { xs: '0.65rem', sm: '0.7rem' },
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.primary',
                              fontWeight: 600,
                              fontSize: { xs: '0.8rem', sm: '0.875rem' },
                              wordBreak: 'break-word',
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {register.name}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))
              )}
            </Stack>
          </Box>
        )}
      </Popover>
    </Box>
  );
}
