'use client';

import type { IRoleCatalogModule, PermissionsTableProps } from 'src/types/permissions';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import Skeleton from '@mui/material/Skeleton';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';

import { useTranslate } from 'src/locales';
import {
  GetRoleItemsService,
  UpdateRoleItemsService,
  GetRoleItemsCatalogService,
} from 'src/services/security/roles.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

const PermissionsTableSkeleton = () => (
  <Card>
    <CardHeader
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="text" width={250} height={32} />
        </Stack>
      }
      subheader={<Skeleton variant="text" width={180} height={20} sx={{ mt: 1 }} />}
      action={<Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />}
      sx={{ pb: 0 }}
    />
    <CardContent sx={{ pt: 2.5, pb: '20px !important' }}>
      <Stack spacing={1.5}>
        {[1, 2, 3, 4].map((index) => (
          <Box
            key={index}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 2.5, bgcolor: 'grey.50' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Skeleton variant="rounded" width={28} height={28} />
                  <Skeleton variant="text" width={150} height={24} />
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Skeleton variant="rounded" width={50} height={24} />
                  <Skeleton variant="circular" width={24} height={24} />
                </Stack>
              </Stack>
            </Box>
          </Box>
        ))}
      </Stack>
    </CardContent>
  </Card>
);

// ----------------------------------------------------------------------

export function PermissionsTable({ roleId, roleName, isDefault }: PermissionsTableProps) {
  const { t } = useTranslate('security');
  const { t: tNav } = useTranslate('navbar');

  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<IRoleCatalogModule[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

  const readOnly = isDefault === 1;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [catalogResponse, itemsResponse] = await Promise.all([
        GetRoleItemsCatalogService('admin'),
        GetRoleItemsService(roleId),
      ]);

      setCatalog(catalogResponse.data?.data || []);

      const assigned = new Set<number>();
      (itemsResponse.data?.data || []).forEach((module) => {
        module.items.forEach((item) => assigned.add(item.itemId));
      });
      setSelectedItemIds(assigned);
    } catch {
      toast.error(t('permissions.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [roleId, t]);

  useEffect(() => {
    if (roleId) {
      loadData();
    }
  }, [roleId, loadData]);

  const applyNewSelection = useCallback(
    async (newSelected: Set<number>, previousSelected: Set<number>) => {
      setSelectedItemIds(newSelected);
      try {
        const response = await UpdateRoleItemsService(roleId, Array.from(newSelected));
        if (response.data?.message) {
          toast.success(response.data.message);
        } else {
          toast.success(t('permissions.messages.success.saving'));
        }
      } catch {
        setSelectedItemIds(previousSelected);
        toast.error(t('permissions.messages.error.saving'));
      }
    },
    [roleId, t]
  );

  const handleToggleItem = useCallback(
    (itemId: number) => {
      if (readOnly) return;
      const newSelected = new Set(selectedItemIds);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      applyNewSelection(newSelected, selectedItemIds);
    },
    [readOnly, selectedItemIds, applyNewSelection]
  );

  const handleSelectModule = useCallback(
    (module: IRoleCatalogModule) => {
      if (readOnly) return;
      const moduleItemIds = module.items.map((i) => i.itemId);
      const moduleAllSelected = moduleItemIds.every((id) => selectedItemIds.has(id));
      const newSelected = new Set(selectedItemIds);
      if (moduleAllSelected) {
        moduleItemIds.forEach((id) => newSelected.delete(id));
      } else {
        moduleItemIds.forEach((id) => newSelected.add(id));
      }
      applyNewSelection(newSelected, selectedItemIds);
    },
    [readOnly, selectedItemIds, applyNewSelection]
  );

  const handleSelectAll = useCallback(() => {
    if (readOnly) return;
    const allItemIds = catalog.flatMap((m) => m.items.map((i) => i.itemId));
    const allSelected = allItemIds.every((id) => selectedItemIds.has(id));
    const newSelected = allSelected ? new Set<number>() : new Set(allItemIds);
    applyNewSelection(newSelected, selectedItemIds);
  }, [readOnly, catalog, selectedItemIds, applyNewSelection]);

  const allItemIds = catalog.flatMap((m) => m.items.map((i) => i.itemId));
  const globalAllSelected = allItemIds.length > 0 && allItemIds.every((id) => selectedItemIds.has(id));
  const globalSomeSelected = allItemIds.some((id) => selectedItemIds.has(id)) && !globalAllSelected;

  const getModuleSelectedCount = (module: IRoleCatalogModule) =>
    module.items.filter((item) => selectedItemIds.has(item.itemId)).length;

  if (loading) {
    return <PermissionsTableSkeleton />;
  }

  if (!catalog.length) {
    return (
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:shield-check-bold" width={24} />
              <Typography variant="h6">
                {t('permissions.table.title')} {roleName && `- ${roleName}`}
              </Typography>
            </Box>
          }
        />
        <EmptyContent
          filled
          title={t('permissions.empty.title')}
          description={t('permissions.empty.description')}
          sx={{ py: 10 }}
        />
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      {readOnly && (
        <Alert severity="info" icon={<Iconify icon="solar:shield-check-bold" />}>
          {t('permissions.info.readOnly')}
        </Alert>
      )}

      <Card>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Iconify icon="solar:shield-check-bold" width={28} sx={{ color: 'success.main' }} />
              <Typography variant="h6">
                {t('permissions.table.title')} {roleName && `- ${roleName}`}
              </Typography>
            </Stack>
          }
          subheader={t('permissions.table.subtitle')}
          action={
            !readOnly && (
              <FormControlLabel
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {t('permissions.table.selectAll')}
                  </Typography>
                }
                control={
                  <Checkbox
                    checked={globalAllSelected}
                    indeterminate={globalSomeSelected}
                    onChange={handleSelectAll}
                    size="small"
                  />
                }
                sx={{ mr: 0 }}
              />
            )
          }
          sx={{ pb: 0 }}
        />

        <CardContent sx={{ pt: 2.5, pb: '20px !important' }}>
          <Stack spacing={1.5}>
            {catalog.map((module) => {
              const selectedCount = getModuleSelectedCount(module);
              const totalCount = module.items.length;
              const hasSelected = selectedCount > 0;
              const moduleAllSelected = totalCount > 0 && selectedCount === totalCount;
              const moduleSomeSelected = hasSelected && !moduleAllSelected;

              return (
                <Accordion
                  key={module.moduleId}
                  defaultExpanded={false}
                  disableGutters
                  sx={{
                    border: '1px solid',
                    borderColor: hasSelected ? 'primary.light' : 'divider',
                    borderRadius: '10px !important',
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    boxShadow: 'none',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <Iconify
                        icon="solar:alt-arrow-down-bold"
                        width={18}
                        sx={{ color: 'text.secondary' }}
                      />
                    }
                    sx={{
                      '&.MuiAccordionSummary-root': { padding: '0 20px', minHeight: 56 },
                      bgcolor: hasSelected ? 'primary.lighter' : 'grey.50',
                      transition: 'background-color 0.2s',
                      '& .MuiAccordionSummary-content': { my: 0, mr: 1 },
                      '& .MuiAccordionSummary-expandIconWrapper': { 
                        alignItems: 'center',
                        alignSelf: 'center'
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ width: 1 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            p: 0.75,
                            borderRadius: 1,
                            bgcolor: hasSelected ? 'primary.main' : 'grey.200',
                            color: hasSelected ? 'common.white' : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s, color 0.2s',
                          }}
                        >
                          <Iconify icon="solar:list-bold" width={16} />
                        </Box>

                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {tNav(module.moduleName) || module.moduleName}
                        </Typography>
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Label
                          variant="soft"
                          color={hasSelected ? 'primary' : 'default'}
                          sx={{ fontWeight: 600 }}
                        >
                          {selectedCount}/{totalCount}
                        </Label>

                        {!readOnly && (
                          <Checkbox
                            size="small"
                            checked={moduleAllSelected}
                            indeterminate={moduleSomeSelected}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectModule(module);
                            }}
                            sx={{ p: 0.5 }}
                          />
                        )}
                      </Stack>
                    </Stack>
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 0 }}>
                    <Box sx={{ px: 2.5, py: 2 }}>
                      <Grid container spacing={1.5}>
                        {module.items.map((item) => {
                          const isSelected = selectedItemIds.has(item.itemId);

                          return (
                            <Grid key={item.itemId} size={{ xs: 12, sm: 6, md: 4 }}>
                              <Card
                                variant="outlined"
                                onClick={() => handleToggleItem(item.itemId)}
                                sx={{
                                  cursor: readOnly ? 'default' : 'pointer',
                                  borderRadius: 1.5,
                                  borderColor: isSelected ? 'primary.main' : 'divider',
                                  bgcolor: isSelected ? 'primary.lighter' : 'background.paper',
                                  transition: 'all 0.15s ease',
                                  ...(!readOnly && {
                                    '&:hover': {
                                      borderColor: 'primary.light',
                                      bgcolor: isSelected ? 'primary.lighter' : 'grey.50',
                                      boxShadow: (theme) =>
                                        theme.customShadows?.z4 ||
                                        '0 4px 8px 0 rgba(0,0,0,0.08)',
                                    },
                                  }),
                                }}
                              >
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  sx={{ px: 2, py: 1.5, gap: 1 }}
                                >
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    sx={{ minWidth: 0 }}
                                  >
                                    <Box
                                      sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        bgcolor: isSelected ? 'primary.main' : 'text.disabled',
                                        flexShrink: 0,
                                        transition: 'background-color 0.15s',
                                      }}
                                    />
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: isSelected ? 600 : 400,
                                        color: isSelected ? 'primary.dark' : 'text.primary',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        transition: 'color 0.15s',
                                      }}
                                    >
                                      {tNav(item.itemName) || item.itemName}
                                    </Typography>
                                  </Stack>

                                  <Switch
                                    checked={isSelected}
                                    disabled={readOnly}
                                    size="small"
                                    color="primary"
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() => handleToggleItem(item.itemId)}
                                    sx={{ flexShrink: 0 }}
                                  />
                                </Stack>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
