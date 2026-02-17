'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetNineBoxLiveByCampaingIdService } from 'src/services/performance/configure-evaluations.service';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EvaluationsNineBoxCanva } from '../evaluations-nine-box-canva';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

type Employee = {
  participantId: string;
  employeeId: string;
  fullName: string;
  jobTitle: string;
  xScore: number;
  yScore: number;
};

type Box = {
  boxNumber: number;
  label: string;
  colorCode: string;
  employees: Employee[];
};

type NineBoxData = {
  campaignId: string;
  campaignName: string;
  boxes: Box[];
};

// ----------------------------------------------------------------------

export function EvaluationsNineBoxView({ id }: Props) {
  const { t } = useTranslate('performance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nineBoxData, setNineBoxData] = useState<NineBoxData | null>(null);

  const fetchNineBoxData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await GetNineBoxLiveByCampaingIdService(id);

      if (response.data && response.data.data) {
        setNineBoxData(response.data.data);
      } else {
        setError(t('nine-box.messages.error.noData'));
      }
    } catch (err: any) {
      console.error('Error fetching Nine Box data:', err);
      setError(err.message || t('nine-box.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (id) {
      fetchNineBoxData();
    }
  }, [id, fetchNineBoxData]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('nine-box.title')}
        links={[
          { name: t('nine-box.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('nine-box.breadcrumbs.evaluate') },
          { name: t('nine-box.breadcrumbs.nineBox'), href: paths.dashboard.performance.nineBox },
          { name: t('nine-box.breadcrumbs.matrix') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress size={60} />
        </Box>
      )}

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && nineBoxData && (
        <Stack spacing={4}>
          {/* Header profesional con gradiente */}
          <Box
            sx={{
              background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              borderRadius: 3,
              p: { xs: 3, md: 4 },
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '40%',
                height: '100%',
                background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
              },
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ flex: 1, zIndex: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  {nineBoxData.campaignName}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    opacity: 0.95,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {t('nine-box.campaignSubtitle', { id: nineBoxData.campaignId })}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  px: { xs: 2.5, sm: 4 },
                  py: { xs: 2, sm: 2.5 },
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.3)',
                  minWidth: { xs: '100%', sm: 'auto' },
                  justifyContent: { xs: 'space-between', sm: 'flex-start' },
                  zIndex: 1,
                }}
              >
                <Box>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 900,
                      lineHeight: 1,
                      fontSize: { xs: '2rem', sm: '2.5rem' },
                    }}
                  >
                    {nineBoxData.boxes.reduce((acc, box) => acc + box.employees.length, 0)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 0.9,
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      letterSpacing: 1,
                      fontSize: '0.75rem',
                    }}
                  >
                    {t('nine-box.participants')}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>

          <EvaluationsNineBoxCanva data={nineBoxData} />
        </Stack>
      )}
    </DashboardContent>
  );
}