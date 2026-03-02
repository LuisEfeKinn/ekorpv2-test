'use client';

import { useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ButtonGroup from '@mui/material/ButtonGroup';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onFitToScreen?: () => void;
  onFullscreen?: () => void;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
};

export function ChartControls({
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen,
  onFullscreen,
  zoomLevel = 1,
  onZoomChange,
  minZoom = 0.1,
  maxZoom = 3,
}: Props) {
  const { t } = useTranslate('organization');
  const [showZoomSlider, setShowZoomSlider] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);



  const zoomPercentage = Math.round(zoomLevel * 100);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {/* ✅ Controles principales */}
      <Box
        sx={{
          p: 1,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* Botones de zoom */}
        <ButtonGroup orientation="vertical" size="small" variant="text">
          <Tooltip title={t('organigrama.chartControls.zoomIn')} placement="left">
            <IconButton 
              onClick={onZoomIn} 
              disabled={zoomLevel >= maxZoom}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Iconify icon={"eva:plus-outline" as any} width={18} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('organigrama.chartControls.zoomOut')} placement="left">
            <IconButton 
              onClick={onZoomOut} 
              disabled={zoomLevel <= minZoom}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Iconify icon={"eva:minus-outline" as any} width={18} />
            </IconButton>
          </Tooltip>
          
          <Divider />
          
          {/* Porcentaje de zoom clickeable */}
          <Tooltip title={t('organigrama.chartControls.adjustZoom')} placement="left">
            <Button
              size="small"
              onClick={() => setShowZoomSlider(!showZoomSlider)}
              sx={{
                minWidth: 'auto',
                px: 1,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'text.primary',
              }}
            >
              {zoomPercentage}%
            </Button>
          </Tooltip>
          
          <Divider />
          
          <Tooltip title={t('organigrama.chartControls.fitToScreen')} placement="left">
            <IconButton onClick={onFitToScreen}>
              <Iconify icon={"solar:maximize-square-2-bold" as any} width={18} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('organigrama.chartControls.resetZoom')} placement="left">
            <IconButton onClick={onZoomReset}>
              <Iconify icon={"solar:refresh-bold" as any} width={18} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('organigrama.chartControls.fullscreen')} placement="left">
            <IconButton onClick={onFullscreen}>
              <Iconify icon={"solar:full-screen-bold" as any} width={18} />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Box>

      {/* ✅ Slider de zoom (colapsible) */}
      {showZoomSlider && (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid',
            borderColor: 'divider',
            minWidth: 200,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" fontWeight={600}>
              {t('organigrama.chartControls.zoomLevel')}
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => setShowZoomSlider(false)}
              sx={{ ml: 1 }}
            >
              <Iconify icon="mingcute:close-line" width={16} />
            </IconButton>
          </Box>
          
          <Box sx={{ px: 1 }}>
            <Slider
              size="small"
              value={zoomLevel}
              onChange={(_event: Event, newValue: number | number[]) => {
                const zoom = Array.isArray(newValue) ? newValue[0] : newValue;
                onZoomChange?.(zoom); // Cambio directo sin throttling para mejor respuesta
              }}
              min={minZoom}
              max={maxZoom}
              step={0.05}
              marks={[
                { value: 0.5, label: '50%' },
                { value: 1, label: '100%' },
                { value: 1.5, label: '150%' },
                { value: 2, label: '200%' },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              sx={{
                '& .MuiSlider-thumb': {
                  transition: 'none !important',
                },
                '& .MuiSlider-track': {
                  transition: 'none !important',
                },
                '& .MuiSlider-rail': {
                  transition: 'none !important',
                },
                '& *': {
                  transition: 'none !important',
                },
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
            <Button size="small" variant="outlined" onClick={() => onZoomChange?.(0.5)}>
              50%
            </Button>
            <Button size="small" variant="outlined" onClick={() => onZoomChange?.(1)}>
              100%
            </Button>
            <Button size="small" variant="outlined" onClick={() => onZoomChange?.(1.5)}>
              150%
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}