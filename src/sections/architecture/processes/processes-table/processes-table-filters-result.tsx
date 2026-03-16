import type { TimeUnitOption, ProcessTypeOption, ProcessFlowFilters } from './processes-table-toolbar';

import dayjs from 'dayjs';
import React, { useMemo, useCallback } from 'react';

import Chip, { chipClasses } from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  name: string;
  onNameChange: (value: string) => void;
  flowFilters: ProcessFlowFilters;
  onFlowFilters: (next: Partial<ProcessFlowFilters>) => void;
  processTypeOptions: ProcessTypeOption[];
  timeUnitOptions: TimeUnitOption[];
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function ProcessFiltersResult({
  name,
  onNameChange,
  flowFilters,
  onFlowFilters,
  processTypeOptions,
  timeUnitOptions,
  onReset,
  totalResults,
  sx,
}: Props) {
  const { t } = useTranslate('architecture');
  const { t: tCommon } = useTranslate('common');
  
  const handleRemoveKeyword = useCallback(() => {
    onNameChange('');
  }, [onNameChange]);

  const handleRemoveType = useCallback(() => {
    onFlowFilters({ type: null });
  }, [onFlowFilters]);

  const handleRemoveRequiresOla = useCallback(() => {
    onFlowFilters({ requiresOLA: null });
  }, [onFlowFilters]);

  const handleRemoveStatus = useCallback(() => {
    onFlowFilters({ status: null });
  }, [onFlowFilters]);

  const handleRemoveTimeUnit = useCallback(() => {
    onFlowFilters({ timeUnitId: null });
  }, [onFlowFilters]);

  const handleRemoveDateRange = useCallback(() => {
    onFlowFilters({ startDate: null, endDate: null });
  }, [onFlowFilters]);

  const typeLabel = useMemo(() => {
    if (flowFilters.type === null) return '';
    return processTypeOptions.find((o) => o.value === flowFilters.type)?.label ?? `#${flowFilters.type}`;
  }, [flowFilters.type, processTypeOptions]);

  const timeUnitLabel = useMemo(() => {
    if (flowFilters.timeUnitId === null) return '';
    return timeUnitOptions.find((o) => o.value === flowFilters.timeUnitId)?.label ?? `#${flowFilters.timeUnitId}`;
  }, [flowFilters.timeUnitId, timeUnitOptions]);

  const requiresOlaLabel = useMemo(() => {
    if (flowFilters.requiresOLA === null) return '';
    return flowFilters.requiresOLA ? t('process.table.form.options.yes') : t('process.table.form.options.no');
  }, [flowFilters.requiresOLA, t]);

  const statusLabel = useMemo(() => {
    if (flowFilters.status === null) return '';
    return flowFilters.status === 1 ? t('process.table.status.active') : t('process.table.status.inactive');
  }, [flowFilters.status, t]);

  const dateRangeLabel = useMemo(() => {
    if (!flowFilters.startDate && !flowFilters.endDate) return '';
    const start = flowFilters.startDate ? dayjs(flowFilters.startDate).format('YYYY-MM-DD') : '';
    const end = flowFilters.endDate ? dayjs(flowFilters.endDate).format('YYYY-MM-DD') : '';
    return [start, end].filter(Boolean).join(' - ');
  }, [flowFilters.endDate, flowFilters.startDate]);

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={`${tCommon('filters.type')}:`} isShow={flowFilters.type !== null}>
        <Chip
          {...chipProps}
          label={typeLabel}
          onDelete={handleRemoveType}
          sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
        />
      </FiltersBlock>

      <FiltersBlock label={`${tCommon('filters.requiresOLA')}:`} isShow={flowFilters.requiresOLA !== null}>
        <Chip {...chipProps} label={requiresOlaLabel} onDelete={handleRemoveRequiresOla} />
      </FiltersBlock>

      <FiltersBlock label={`${tCommon('filters.status')}:`} isShow={flowFilters.status !== null}>
        <Chip
          {...chipProps}
          label={statusLabel}
          onDelete={handleRemoveStatus}
          sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
        />
      </FiltersBlock>

      <FiltersBlock label={`${tCommon('filters.timeUnit')}:`} isShow={flowFilters.timeUnitId !== null}>
        <Chip {...chipProps} label={timeUnitLabel} onDelete={handleRemoveTimeUnit} />
      </FiltersBlock>

      <FiltersBlock
        label={`${tCommon('filters.startDate')} - ${tCommon('filters.endDate')}:`}
        isShow={!!flowFilters.startDate || !!flowFilters.endDate}
      >
        <Chip {...chipProps} label={dateRangeLabel} onDelete={handleRemoveDateRange} />
      </FiltersBlock>

      <FiltersBlock label={`${t('process.table.table.filters.keyword')}:`} isShow={!!name}>
        <Chip {...chipProps} label={name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
