'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetDomainPaginationService } from 'src/services/architecture/catalogs/domains.service';
import { GetDataTypesPaginationService } from 'src/services/architecture/catalogs/dataTypes.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Domain = {
  id: number;
  name: string;
  code: string;
  color?: string;
};

type DataType = {
  id: number;
  name: string;
};

type ApplicationFiltersPopoverProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onApplyFilters: (domainId: number | null, typeId: number | null, domainName?: string, typeName?: string) => void;
  selectedDomainId?: number | null;
  selectedTypeId?: number | null;
  sx?: SxProps<Theme>;
};

// ----------------------------------------------------------------------

export function ApplicationFiltersPopover({
  anchorEl,
  open,
  onClose,
  onApplyFilters,
  selectedDomainId = null,
  selectedTypeId = null,
  sx,
}: ApplicationFiltersPopoverProps) {
  const { t } = useTranslate('architecture');

  const [domains, setDomains] = useState<Domain[]>([]);
  const [dataTypes, setDataTypes] = useState<DataType[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedType, setSelectedType] = useState<DataType | null>(null);

  // Cargar dominios
  const loadDomains = useCallback(async () => {
    setLoadingDomains(true);
    try {
      const response = await GetDomainPaginationService({});
      if (response && response.data && Array.isArray(response.data[0])) {
        setDomains(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading domains:', error);
      toast.error(t('application.diagram.filters.errors.loadDomains'));
    } finally {
      setLoadingDomains(false);
    }
  }, [t]);

  // Cargar tipos de datos
  const loadDataTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const response = await GetDataTypesPaginationService({});
      if (response && response.data && Array.isArray(response.data[0])) {
        setDataTypes(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading data types:', error);
      toast.error(t('application.diagram.filters.errors.loadTypes'));
    } finally {
      setLoadingTypes(false);
    }
  }, [t]);

  // Cargar datos al abrir
  useEffect(() => {
    if (open) {
      loadDomains();
      loadDataTypes();
    }
  }, [open, loadDomains, loadDataTypes]);

  // Sincronizar valores seleccionados cuando cambian las props
  useEffect(() => {
    if (selectedDomainId && domains.length > 0) {
      const domain = domains.find((d) => d.id === selectedDomainId);
      setSelectedDomain(domain || null);
    } else {
      setSelectedDomain(null);
    }
  }, [selectedDomainId, domains]);

  useEffect(() => {
    if (selectedTypeId && dataTypes.length > 0) {
      const type = dataTypes.find((tp) => tp.id === selectedTypeId);
      setSelectedType(type || null);
    } else {
      setSelectedType(null);
    }
  }, [selectedTypeId, dataTypes]);

  // Handler para aplicar filtros
  const handleApply = useCallback(() => {
    onApplyFilters(
      selectedDomain?.id || null, 
      selectedType?.id || null,
      selectedDomain?.name,
      selectedType?.name
    );
    onClose();
  }, [selectedDomain, selectedType, onApplyFilters, onClose]);

  // Handler para resetear filtros
  const handleReset = useCallback(() => {
    setSelectedDomain(null);
    setSelectedType(null);
    onApplyFilters(null, null);
  }, [onApplyFilters]);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      slotProps={{
        paper: {
          sx: {
            width: 360,
            p: 3,
            borderRadius: 2,
            boxShadow: (theme) => theme.customShadows.dropdown,
            ...sx,
          },
        },
      }}
    >
      <Stack spacing={3}>
        {/* Título */}
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('application.diagram.filters.title')}
        </Typography>

        {/* Autocomplete de Dominios */}
        <Autocomplete
          fullWidth
          options={domains}
          value={selectedDomain}
          onChange={(event, newValue) => setSelectedDomain(newValue)}
          getOptionLabel={(option) => option.name}
          loading={loadingDomains}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('application.diagram.filters.domain')}
              placeholder={t('application.diagram.filters.domainPlaceholder')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingDomains ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                {option.color && (
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: option.color,
                      flexShrink: 0,
                    }}
                  />
                )}
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  {option.code && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {option.code}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>
          )}
          noOptionsText={t('application.diagram.filters.noOptions')}
        />

        {/* Autocomplete de Tipos */}
        <Autocomplete
          fullWidth
          options={dataTypes}
          value={selectedType}
          onChange={(event, newValue) => setSelectedType(newValue)}
          getOptionLabel={(option) => option.name}
          loading={loadingTypes}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('application.diagram.filters.type')}
              placeholder={t('application.diagram.filters.typePlaceholder')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingTypes ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          noOptionsText={t('application.diagram.filters.noOptions')}
        />

        {/* Botones de acción */}
        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleReset}
            disabled={!selectedDomain && !selectedType}
          >
            {t('application.diagram.filters.reset')}
          </Button>
          <Button variant="contained" onClick={handleApply}>
            {t('application.diagram.filters.apply')}
          </Button>
        </Stack>
      </Stack>
    </Popover>
  );
}
