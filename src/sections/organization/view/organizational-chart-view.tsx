'use client';

import type { OrganizationPosition, OrganizationalChartData } from 'src/types/organizational-chart-position';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { 
  OrganizationalChartService,
} from 'src/services/organization/organizational-chart.service';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { OrganizationalChart } from 'src/components/organizational-chart';
import { ChartControls } from 'src/components/organizational-chart/chart-controls';
import { PositionChartNodeOption3 } from 'src/components/organizational-chart/position-chart-node-option3';

import { PositionCreateDrawer } from '../organization-position-create-drawer';

// ----------------------------------------------------------------------

export function OrganizationalChartView() {
  const { t } = useTranslate('organization');
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<OrganizationalChartData | null>(null);
  const [openCreatePosition, setOpenCreatePosition] = useState(false);
  const [selectedPositionForEdit, setSelectedPositionForEdit] = useState<OrganizationPosition | null>(null);
  
  // Estados para zoom
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartContentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const zoomLevelRef = useRef(1);
  const [displayZoom, setDisplayZoom] = useState(1);
  const updateDisplayRef = useRef<number | null>(null);

  // Función para aplicar zoom directamente al DOM (ultra optimizada)
  const applyZoom = useCallback((newZoom: number) => {
    if (chartContentRef.current) {
      zoomLevelRef.current = newZoom;
      chartContentRef.current.style.transform = `scale(${newZoom})`;
      
      // Usar RAF para sincronizar con el repaint del navegador
      if (updateDisplayRef.current) {
        cancelAnimationFrame(updateDisplayRef.current);
      }
      
      updateDisplayRef.current = requestAnimationFrame(() => {
        setDisplayZoom(newZoom);
        updateDisplayRef.current = null;
      });
    }
  }, []);

  // ✅ Función para centrar SOLO al cargar inicialmente
  const centerOnLoad = useCallback(() => {
    if (scrollContainerRef.current && chartContentRef.current) {
      const scrollContainer = scrollContainerRef.current;
      const contentContainer = chartContentRef.current;
      
      // Obtener el elemento interno que contiene el organigrama real
      const innerBox = contentContainer.querySelector(':scope > div');
      
      if (innerBox) {
        // Obtener las dimensiones reales del scroll
        const scrollWidth = scrollContainer.scrollWidth;
        const clientWidth = scrollContainer.clientWidth;
        
        // Calcular el centro exacto del contenido scrolleable
        const centerX = (scrollWidth - clientWidth) / 2;
        
        // Centrar horizontalmente y mantener arriba con un pequeño margen
        scrollContainer.scrollTo({
          left: Math.max(0, centerX),
          top: 20, // Pequeño margen superior
          behavior: 'smooth'
        });
      } else {
        console.warn('⚠️ No se encontró el elemento interno del organigrama');
      }
    }
  }, []);

  // Cargar datos del organigrama
  const loadChartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await OrganizationalChartService.getOrganizationalChart();
      setChartData(response.data);
    } catch (err) {
      console.error('Error loading organizational chart:', err);
      setError(t('organigrama.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  // Inicializar zoom y centrar cuando se carga el organigrama
  useEffect(() => {
    if (chartData?.root && !loading && chartContentRef.current && scrollContainerRef.current) {
      // Aplicar zoom inicial del 60% (0.6)
      applyZoom(0.6);
      
      let mutationObserver: MutationObserver | null = null;
      let centeringTimeout: NodeJS.Timeout | null = null;
      let mutationCount = 0;
      let lastMutationTime = Date.now();
      
      // Función para centrar con seguimiento
      const attemptCenter = () => {
        if (chartContentRef.current) {
          const contentRect = chartContentRef.current.getBoundingClientRect();
          
          // Si el contenido tiene dimensiones válidas, centrar
          if (contentRect.width > 0 && contentRect.height > 0) {
            console.log('Centrando organigrama después de', mutationCount, 'mutaciones');
            centerOnLoad();
          }
        }
      };
      
      // Observar cambios en el DOM del organigrama
      if (chartContentRef.current) {
        mutationObserver = new MutationObserver((mutations) => {
          const now = Date.now();
          mutationCount += mutations.length;
          lastMutationTime = now;
          
          // Cancelar timeout anterior si existe
          if (centeringTimeout) {
            clearTimeout(centeringTimeout);
          }
          
          // Esperar 800ms después de la última mutación antes de centrar
          // Esto da tiempo a que todos los nodos se expandan
          centeringTimeout = setTimeout(() => {
            const timeSinceLastMutation = Date.now() - lastMutationTime;
            
            // Solo centrar si han pasado al menos 700ms sin mutaciones
            if (timeSinceLastMutation >= 700) {
              attemptCenter();
              
              // Desconectar el observer después de centrar
              if (mutationObserver) {
                mutationObserver.disconnect();
              }
            }
          }, 800);
        });
        
        // Observar cambios en el subárbol (nodos que se agregan)
        mutationObserver.observe(chartContentRef.current, {
          childList: true,
          subtree: true,
          attributes: false,
        });
      }
      
      // Fallback: centrar después de 3 segundos si no se ha centrado aún
      const fallbackTimeout = setTimeout(() => {
        console.log('⏰ Centrando por timeout (fallback)');
        attemptCenter();
        if (mutationObserver) {
          mutationObserver.disconnect();
        }
      }, 3000);
      
      return () => {
        if (mutationObserver) {
          mutationObserver.disconnect();
        }
        if (centeringTimeout) {
          clearTimeout(centeringTimeout);
        }
        clearTimeout(fallbackTimeout);
      };
    }
    
    return undefined;
  }, [chartData, loading, centerOnLoad, applyZoom]);  const ensureChildrenArray = (position: OrganizationPosition): OrganizationPosition & { children: OrganizationPosition[] } => {
    // Filtrar solo children que realmente existen y tienen ID válido
    const validChildren = position.children?.filter(child => 
      child && 
      child.positionId && 
      child.name
    ) || [];
    
    return {
      ...position,
      children: validChildren,
    };
  };

  // Handlers para las acciones del cargo
  const handlePositionEdit = useCallback(async (position: OrganizationPosition) => {
    console.log('📝 Editando cargo:', position);
    setSelectedPositionForEdit(position);
    setOpenCreatePosition(true);
  }, []);

  const handlePositionDelete = useCallback(async (position: OrganizationPosition) => {
    if (!position.positionId) return;

    try {
      await OrganizationalChartService.deletePosition(position.positionId);
      console.log('✅ Cargo eliminado:', position.positionId);
      await loadChartData();
    } catch (err) {
      console.error('Error deleting position:', err);
      alert(t('organigrama.messages.deleteError'));
    }
  }, [loadChartData, t]);

  const handlePositionAssign = useCallback(async (position: OrganizationPosition) => {
    console.log('👥 Asignando empleados al cargo:', position);
    alert(t('organigrama.messages.assignmentFor'));
  }, [t]);

  // Handlers para zoom (ultra optimizados)
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevelRef.current + 0.1, 3);
    applyZoom(Math.round(newZoom * 100) / 100);
  }, [applyZoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevelRef.current - 0.1, 0.1);
    applyZoom(Math.round(newZoom * 100) / 100);
  }, [applyZoom]);

  const handleZoomReset = useCallback(() => {
    applyZoom(1);
  }, [applyZoom]);

  const handleZoomChange = useCallback((newZoom: number) => {
    applyZoom(Math.round(newZoom * 100) / 100);
  }, [applyZoom]);

  const handleFitToScreen = useCallback(() => {
    if (chartContainerRef.current && chartContentRef.current) {
      const container = chartContainerRef.current;
      const content = chartContentRef.current;
      
      // Resetear zoom temporalmente para obtener dimensiones reales
      chartContentRef.current.style.transform = 'scale(1)';
      
      const containerRect = container.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      
      const padding = 40;
      const scaleX = (containerRect.width - padding) / contentRect.width;
      const scaleY = (containerRect.height - padding) / contentRect.height;
      
      const optimalZoom = Math.min(scaleX, scaleY, 1);
      const finalZoom = Math.max(optimalZoom, 0.1);
      
      applyZoom(finalZoom);
    }
  }, [applyZoom]);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && chartContainerRef.current) {
      chartContainerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  }, []);

  // Escuchar cambios de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handler para zoom con rueda del mouse (ultra optimizado)
  const handleWheel = useCallback((event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      
      const delta = event.deltaY > 0 ? -0.05 : 0.05; // Increments más pequeños para suavidad
      const newZoom = Math.min(Math.max(zoomLevelRef.current + delta, 0.1), 3);
      
      applyZoom(Math.round(newZoom * 100) / 100);
    }
  }, [applyZoom]);

  // Agregar listener para zoom con rueda
  useEffect(() => {
    const container = chartContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
        // Cleanup RAF si está pendiente
        if (updateDisplayRef.current) {
          cancelAnimationFrame(updateDisplayRef.current);
        }
      };
    }
    return undefined;
  }, [handleWheel]);

  // Handlers para el drawer
  const handleCreatePosition = useCallback(() => {
    setSelectedPositionForEdit(null);
    setOpenCreatePosition(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setOpenCreatePosition(false);
    setSelectedPositionForEdit(null);
  }, []);

  // Renderizar nodo de cargo
  const renderPositionNode = useCallback((positionData: OrganizationPosition) => (
    <PositionChartNodeOption3
      data={positionData}
      onEdit={handlePositionEdit}
      onDelete={handlePositionDelete}
      onAssign={handlePositionAssign}
    />
  ), [handlePositionEdit, handlePositionDelete, handlePositionAssign]);

  // Estado de carga
  if (loading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('organigrama.title')}
          links={[
            { name: t('organization.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('organization.breadcrumbs.organizationUnit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            gap: 2,
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary">
            {t('organigrama.messages.loading')}
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('organigrama.title')}
          links={[
            { name: t('organigrama.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('organigrama.title') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        
        <Alert 
          severity="error" 
          action={
            <Button onClick={loadChartData} variant="outlined" size="small">
              {t('organigrama.actions.retry')}
            </Button>
          }
        >
          {error}
        </Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('organigrama.title')}
        links={[
          { name: t('organization.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('organization.breadcrumbs.organizationUnit') },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {/* ✅ Botón de organizaciones con mejor diseño */}
            <Button
              component={RouterLink}
              href={paths.dashboard.organizations.organizations}
              variant="outlined"
              size="medium"
              startIcon={<Iconify icon="solar:buildings-2-line-duotone" width={20} />}
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                bgcolor: 'background.paper',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                },
                fontWeight: 600,
                px: 2.5,
              }}
            >
              {t('organigrama.actions.manageOrganizations')}
            </Button>
            
            {/* ✅ Botón principal mejorado */}
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />} 
              onClick={handleCreatePosition}
            >
              {t('organigrama.actions.createPosition')}
            </Button>
          </Box>
        }
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      {/* ✅ Header mejorado con métricas y descripción */}
      {chartData && (
        <Box>
          {/* ✅ Panel de métricas mejorado */}
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: { 
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)'
              },
              gap: 2,
              mb: 3,
            }}
          >
            {/* Total de cargos */}
            <Box
              sx={{
                p: 2.5,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: 'primary.lighter',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify 
                    icon="solar:case-minimalistic-bold-duotone" 
                    width={24} 
                    color="primary.main" 
                  />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {chartData.totalPositions}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {t('organigrama.metrics.totalPositions')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Total de empleados */}
            <Box
              sx={{
                p: 2.5,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: 'success.lighter',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify 
                    icon="solar:users-group-rounded-bold-duotone" 
                    width={24} 
                    color="success.main" 
                  />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {chartData.totalEmployees}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {t('organigrama.metrics.activeEmployees')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Organizaciones */}
            <Box
              sx={{
                p: 2.5,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: 'info.lighter',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify 
                    icon="solar:buildings-2-bold-duotone"
                    width={24} 
                    color="info.main" 
                  />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {chartData.organizations.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {t('organigrama.metrics.organizations')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* ✅ Métrica adicional: Cargos vacantes */}
            <Box
              sx={{
                p: 2.5,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: 'warning.lighter',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify 
                    icon="solar:user-plus-bold-duotone"
                    width={24} 
                    color="warning.main" 
                  />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {/* ✅ Calcular cargos vacantes */}
                    {chartData.totalVacancies}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {t('organigrama.metrics.openVacancies')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Organigrama */}
      {chartData?.root ? (
        <Box
          ref={chartContainerRef}
          sx={{
            position: 'relative',
            bgcolor: isFullscreen ? 'background.default' : 'background.neutral',
            borderRadius: isFullscreen ? 0 : 2,
            border: '1px solid',
            borderColor: 'divider',
            minHeight: 600,
            height: isFullscreen ? '100vh' : 700,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <ChartControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onFitToScreen={handleFitToScreen}
            onFullscreen={handleFullscreen}
            zoomLevel={displayZoom}
            onZoomChange={handleZoomChange}
            minZoom={0.1}
            maxZoom={3}
          />

          <Box
            ref={scrollContainerRef}
            sx={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              
              '&::-webkit-scrollbar': {
                width: 12,
                height: 12,
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'rgba(0,0,0,0.05)',
                borderRadius: 2,
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(0,0,0,0.2)',
                borderRadius: 2,
                border: '2px solid transparent',
                backgroundClip: 'content-box',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.3)',
                },
              },
            }}
          >
            <Box
              ref={chartContentRef}
              sx={{
                transformOrigin: 'top center',
                minWidth: 'max-content',
                minHeight: 'max-content',
                padding: '50px 500px',
                textAlign: 'center',
                willChange: 'transform',
              }}
            >
              <Box sx={{ display: 'inline-block' }}>
                <OrganizationalChart
                  data={ensureChildrenArray(chartData.root)}
                  lineHeight="120px"
                  lineColor="var(--palette-primary-light)"
                  lineWidth="2px"
                  nodeItem={renderPositionNode}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      ) : (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            {t('organigrama.messages.noData')} 
            <Button 
              size="small" 
              onClick={handleCreatePosition}
              sx={{ ml: 1 }}
            >
              {t('organigrama.actions.createFirstPosition')}
            </Button>
          </Typography>
        </Alert>
      )}

      <PositionCreateDrawer
        open={openCreatePosition}
        onClose={handleCloseDrawer}
        editData={selectedPositionForEdit}
      />
    </DashboardContent>
  );
}