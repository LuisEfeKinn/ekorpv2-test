'use client';

import type { DialogProps } from '@mui/material/Dialog';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import {
  GetRiskScaleMapService,
  GetRiskImpactLevelsService,
  GetRiskToleranceLevelsService,
  GetRiskProbabilityLevelsService,
} from 'src/services/architecture/catalogs/riskTypes.service';

import { Iconify } from 'src/components/iconify';

import { RiskToleranceConfigSection } from './risk-tolerance-config-section';

type Props = DialogProps & {
  open: boolean;
  onClose: () => void;
  dataId?: string;
  source?: 'table' | 'map';
};

export function RiskTypesConfigureModal({ open, onClose, dataId, source, ...other }: Props) {
  const { t } = useTranslate('catalogs');
  const router = useRouter();
  
  const [openToleranceConfig, setOpenToleranceConfig] = useState(false);

  const getLink = (base: string) => source === 'map' ? `${base}&source=map` : base;

  const tf = useCallback((key: string, d: string) => {
    const v = t(key);
    return v && v !== key ? v : d;
  }, [t]);

  const [loading, setLoading] = useState(false);
  const [toleranceLevels, setToleranceLevels] = useState<any[]>([]);
  const [loadingTol, setLoadingTol] = useState(false);
  const [probabilityLevels, setProbabilityLevels] = useState<any[]>([]);
  const [impactLevels, setImpactLevels] = useState<any[]>([]);

  const loadMap = useCallback(async () => {
    if (!dataId) return;
    setLoading(true);
    try {
      await GetRiskScaleMapService(String(dataId));
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, [dataId]);

  const loadTolerance = useCallback(async () => {
    if (!dataId) return;
    setLoadingTol(true);
    try {
      const response = await GetRiskToleranceLevelsService({ risktype: dataId });
      const raw = (response as any)?.data;
      let list: any[] = [];
      if (Array.isArray(raw)) {
        list = Array.isArray(raw[0]) ? raw[0] : raw.filter((it) => typeof it === 'object' && it);
      } else if (Array.isArray((response as any)?.data?.data)) {
        list = (response as any).data.data;
      }
      const sid = String(dataId);
      const filtered = Array.isArray(list)
        ? list.filter((it: any) => String(it?.riskType?.id ?? '') === sid)
        : [];
      setToleranceLevels(filtered);
    } catch {
      setToleranceLevels([]);
    } finally {
      setLoadingTol(false);
    }
  }, [dataId]);

  const loadProbability = useCallback(async () => {
    if (!dataId) return;
    try {
      const res = await GetRiskProbabilityLevelsService({ risktype: dataId });
      const raw = (res as any)?.data;
      const listArr: any[] = Array.isArray(raw) ? (Array.isArray(raw[0]) ? raw[0] : raw) : [];
      setProbabilityLevels(Array.isArray(listArr) ? listArr : []);
    } catch {
      setProbabilityLevels([]);
    }
  }, [dataId]);

  const loadImpact = useCallback(async () => {
    if (!dataId) return;
    try {
      const res = await GetRiskImpactLevelsService({ risktype: dataId });
      const raw = (res as any)?.data;
      const listArr: any[] = Array.isArray(raw) ? (Array.isArray(raw[0]) ? raw[0] : raw) : [];
      setImpactLevels(Array.isArray(listArr) ? listArr : []);
    } catch {
      setImpactLevels([]);
    }
  }, [dataId]);

  useEffect(() => {
    if (open && dataId) {
      loadMap();
      loadTolerance();
      loadProbability();
      loadImpact();
    }
  }, [open, dataId, loadMap, loadTolerance, loadProbability, loadImpact]);

  const probabilityCount = useMemo(() => Array.isArray(probabilityLevels) ? probabilityLevels.length : 0, [probabilityLevels]);

  const impactCount = useMemo(() => Array.isArray(impactLevels) ? impactLevels.length : 0, [impactLevels]);

  const toleranceCount = useMemo(() => Array.isArray(toleranceLevels) ? toleranceLevels.length : 0, [toleranceLevels]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth {...other}>
      <DialogTitle>
        {tf('risk-types.configure.title', 'Configure risk type')}
      </DialogTitle>
      <DialogContent dividers>
        {(loading || loadingTol) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={1.5}>
            <List sx={{ px: 0 }}>
              <ListItem sx={{ px: 0 }}>
                <Box
                  onClick={() => { if (dataId) router.push(getLink(paths.dashboard.architecture.catalogs.riskTypesProbabilityLevels(String(dataId)))); }}
                  sx={{ flex: 1, px: 2, py: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{tf('risk-types.configure.probability', 'Probability Levels')}</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>({probabilityCount})</Typography>
                    <Iconify icon="eva:arrowhead-right-fill" />
                  </Stack>
                </Box>
              </ListItem>
              <ListItem sx={{ px: 0, mt: 1 }}>
                <Box
                  onClick={() => { if (dataId) router.push(paths.dashboard.architecture.catalogs.riskTypesImpactLevels(String(dataId))); }}
                  sx={{ flex: 1, px: 2, py: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{tf('risk-types.configure.impact', 'Impact Levels')}</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>({impactCount})</Typography>
                    <Iconify icon="eva:arrowhead-right-fill" />
                  </Stack>
                </Box>
              </ListItem>
              <ListItem sx={{ px: 0, mt: 1 }}>
                <Box
                  onClick={() => { if (dataId) router.push(getLink(paths.dashboard.architecture.catalogs.riskTypesToleranceLevels(String(dataId)))); }}
                  sx={{ flex: 1, px: 2, py: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{tf('risk-types.configure.tolerance', 'Risk Tolerance Levels')}</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>({toleranceCount})</Typography>
                    <Iconify icon="eva:arrowhead-right-fill" />
                  </Stack>
                </Box>
              </ListItem>
              <ListItem sx={{ px: 0, mt: 1, display: 'block' }}>
                <Box
                  onClick={() => setOpenToleranceConfig(!openToleranceConfig)}
                  sx={{ width: '100%', px: 2, py: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{tf('risk-types.configure.tolerance_config', 'Configure Risk Tolerance Levels')}</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon={openToleranceConfig ? "eva:arrow-ios-upward-fill" : "eva:arrow-ios-downward-fill"} />
                  </Stack>
                </Box>
                <Collapse in={openToleranceConfig}>
                  {dataId && <RiskToleranceConfigSection riskTypeId={dataId} />}
                </Collapse>
              </ListItem>
            </List>
          </Stack>
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={handleClose}>{tf('common.close', 'Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default RiskTypesConfigureModal;
