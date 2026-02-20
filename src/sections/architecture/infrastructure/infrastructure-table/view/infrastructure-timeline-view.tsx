'use client';

import type { SelectChangeEvent } from '@mui/material/Select';

import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Chip, { chipClasses } from '@mui/material/Chip';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetActiveTimelineDataService,
  GetInactiveTimelineDataService,
} from 'src/services/architecture/infrastructure/infrastructureMap.service';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

import { InfrastructureTimeline } from '../infrastructure-timeline';

// ----------------------------------------------------------------------

type TimelineItem = {
  id: number;
  name: string;
  adoptionContractDate: string;
  expirationDate: string;
  renewalDate: string;
  obsolescenceDate: string;
  color: string;
  dependencies: any[];
};

type Filters = {
  status: 'active' | 'inactive';
  field: 'renewal' | 'expired' | 'obsolescence';
};

const defaultFilters: Filters = {
  status: 'active',
  field: 'renewal',
};

// ----------------------------------------------------------------------

export function InfrastructureTimelineView() {
  const { t } = useTranslate('architecture');

  const filters = useSetState<Filters>(defaultFilters);

  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTimelineData = useCallback(async () => {
    setLoading(true);
    try {
      const service =
        filters.state.status === 'active'
          ? GetActiveTimelineDataService
          : GetInactiveTimelineDataService;

      const response = await service({ field: filters.state.field });

      if (response.data) {
        setTimelineData(response.data);
      } else {
        setTimelineData([]);
      }
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      toast.error(t('infrastructure.timeline.messages.error.fetchError'));
      setTimelineData([]);
    } finally {
      setLoading(false);
    }
  }, [filters.state.status, filters.state.field, t]);

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  const handleFilterStatus = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      filters.setState({ status: event.target.checked ? 'active' : 'inactive' });
    },
    [filters]
  );

  const handleFilterField = useCallback(
    (event: SelectChangeEvent<string>) => {
      filters.setState({ field: event.target.value as 'renewal' | 'expired' | 'obsolescence' });
    },
    [filters]
  );

  const handleRemoveStatus = useCallback(() => {
    filters.setState({ status: 'active' });
  }, [filters]);

  const handleRemoveField = useCallback(() => {
    filters.setState({ field: 'renewal' });
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    filters.setState(defaultFilters);
  }, [filters]);

  const canReset =
    filters.state.status !== defaultFilters.status ||
    filters.state.field !== defaultFilters.field;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('infrastructure.timeline.title')}
        links={[
          { name: t('infrastructure.timeline.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('infrastructure.diagram.title'), href: paths.dashboard.architecture.infrastructureDiagram },
          { name: t('infrastructure.timeline.title') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      {/* Filters Section */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Stack spacing={2.5}>
          <Typography variant="h6">{t('infrastructure.timeline.filters.status')}</Typography>

          <Stack
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            direction={{ xs: 'column', md: 'row' }}
          >
            {/* Status Switch */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                {t('infrastructure.timeline.filters.inactive')}
              </Typography>
              <Switch
                checked={filters.state.status === 'active'}
                onChange={handleFilterStatus}
                color="primary"
              />
              <Typography variant="body2" color="text.secondary">
                {t('infrastructure.timeline.filters.active')}
              </Typography>
            </Stack>

            {/* Field Selector */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="field-select-label">{t('infrastructure.timeline.filters.field')}</InputLabel>
              <Select
                labelId="field-select-label"
                id="field-select"
                value={filters.state.field}
                label={t('infrastructure.timeline.filters.field')}
                onChange={handleFilterField}
              >
                <MenuItem value="renewal">{t('infrastructure.timeline.filters.renewal')}</MenuItem>
                <MenuItem value="expired">{t('infrastructure.timeline.filters.expired')}</MenuItem>
                <MenuItem value="obsolescence">
                  {t('infrastructure.timeline.filters.obsolescence')}
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Card>

      {/* Active Filters Display */}
      {canReset && (
        <FiltersResult totalResults={timelineData.length} onReset={handleResetFilters} sx={{ mb: 3 }}>
          <FiltersBlock
            label={`${t('infrastructure.timeline.filters.status')}:`}
            isShow={filters.state.status !== defaultFilters.status}
          >
            <Chip
              {...chipProps}
              label={
                filters.state.status === 'active'
                  ? t('infrastructure.timeline.filters.active')
                  : t('infrastructure.timeline.filters.inactive')
              }
              onDelete={handleRemoveStatus}
              sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
            />
          </FiltersBlock>

          <FiltersBlock
            label={`${t('infrastructure.timeline.filters.field')}:`}
            isShow={filters.state.field !== defaultFilters.field}
          >
            <Chip
              {...chipProps}
              label={t(`infrastructure.timeline.filters.${filters.state.field}`)}
              onDelete={handleRemoveField}
              sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
            />
          </FiltersBlock>
        </FiltersResult>
      )}

      {/* Timeline Component */}
      <InfrastructureTimeline data={timelineData} field={filters.state.field} loading={loading} />
    </DashboardContent>
  );
}