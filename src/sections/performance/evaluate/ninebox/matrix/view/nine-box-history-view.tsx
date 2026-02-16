'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetNineBoxHistoryByCampaingIdService } from 'src/services/performance/configure-evaluations.service';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EvaluationNineBoxHistory } from '../evaluation-nine-box-history';

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

type NineBoxHistoryData = {
  campaignId: string;
  campaignName: string;
  boxes: Box[];
};

// ----------------------------------------------------------------------

export function EvaluationsNineBoxHistoryView({ id }: Props) {
  const { t } = useTranslate('performance');
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<NineBoxHistoryData | null>(null);

  const fetchHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await GetNineBoxHistoryByCampaingIdService(id);

      if (response.data && response.data.data) {
        setHistoryData(response.data.data);
      } else {
        setError(t('nine-box.messages.error.noData'));
      }
    } catch (err: any) {
      console.error('Error fetching Nine Box history:', err);
      setError(err.message || t('nine-box.messages.error.loadingHistory'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (id) {
      fetchHistoryData();
    }
  }, [id, fetchHistoryData]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('nine-box.history.title')}
        links={[
          { name: t('nine-box.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('nine-box.breadcrumbs.evaluate') },
          { name: t('nine-box.breadcrumbs.nineBox'), href: paths.dashboard.performance.nineBox },
          { name: t('nine-box.history.title') },
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

      {!loading && !error && historyData && (
        <>
          <Card
            sx={{
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${theme.palette.background.paper} 100%)`,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent>
              <Stack spacing={1}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {historyData.campaignName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('nine-box.history.subtitle', { id: historyData.campaignId })}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <EvaluationNineBoxHistory data={historyData} />
        </>
      )}

      {!loading && !error && !historyData && (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {t('nine-box.messages.error.noData')}
            </Typography>
          </CardContent>
        </Card>
      )}
    </DashboardContent>
  );
}
