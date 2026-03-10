'use client';

import type { BoxProps } from '@mui/material/Box';
import type { OrganizationPosition } from 'src/types/organizational-chart-position';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AvatarGroup, { avatarGroupClasses } from '@mui/material/AvatarGroup';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface Props extends BoxProps {
  data: OrganizationPosition;
  onEdit?: (position: OrganizationPosition) => void;
  onDelete?: (position: OrganizationPosition) => void;
  onAssign?: (position: OrganizationPosition) => void;
  readonly?: boolean;
}

export function PositionChartNode({ 
  data, 
  onEdit, 
  onDelete, 
  onAssign,
  readonly = false,
  sx, 
  ...other 
}: Props) {

  // ✅ Estado para el menú de acciones
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  // ✅ Handlers para el menú
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event?: {}, reason?: "backdropClick" | "escapeKeyDown") => {
    if (event && 'stopPropagation' in event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  // ✅ Handlers para acciones actualizados
  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onEdit?.(data);
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onDelete?.(data);
  };

  const handleAssign = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onAssign?.(data);
  };

  // ✅ Obtener inicial del cargo
  const getPositionInitial = (name: string) => 
    name.charAt(0).toUpperCase();

  // ✅ Empleados activos
  const activeEmployees = data.assignedEmployees?.filter(emp => emp.isActive) || [];
  const totalEmployees = activeEmployees.length;

  return (
    <Box 
      sx={{ 
        position: 'relative',
        display: 'inline-block',
        margin: '10px',
        ...sx 
      }} 
      {...other}
    >
      <Card
        sx={{
          p: 2.5,
          minWidth: 340,
          maxWidth: 400,
          cursor: 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '2px solid',
          borderColor: 'transparent',
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderLeft: `6px solid ${data.organizationColor}`,
          
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            transform: 'translateY(-4px) scale(1.02)',
            borderColor: data.organizationColor,
            zIndex: 10,
          },
          
          willChange: 'transform, box-shadow, border-color',
        }}
      >
        {/* ✅ Header mejorado - Avatar + Nombre + Acciones */}
        <Box sx={{ mb: 2.5 }}>
          {/* Línea 1: Avatar + Nombre + Botón de acciones */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            {/* Avatar del cargo */}
            <Avatar
              src={data.positionImage ?? undefined}
              sx={{ 
                width: 50, 
                height: 50,
                border: '2px solid',
                borderColor: data.organizationColor,
                fontSize: '1.1rem',
                fontWeight: 700,
                bgcolor: `${data.organizationColor}20`,
                color: data.organizationColor,
                boxShadow: `0 3px 10px ${data.organizationColor}40`,
              }}
            >
              {getPositionInitial(data.name)}
            </Avatar>

            {/* Nombre del cargo */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  lineHeight: 1.3,
                  color: 'text.primary',
                  mb: 0,
                }}
              >
                {data.name}
              </Typography>
            </Box>

            {/* ✅ Botón de acciones (tres puntos) */}
            {!readonly && (onEdit || onDelete || onAssign) && (
              <>
                <Tooltip title="Más opciones" arrow>
                  <IconButton 
                    size="small"
                    onClick={handleMenuOpen}
                    disableRipple
                    sx={{ 
                      width: 32,
                      height: 32,
                      color: 'text.secondary',
                      '&:hover': { 
                        bgcolor: 'grey.200',
                        transform: 'scale(1.05)'
                      },
                      '&:active': {
                        transform: 'scale(0.95)',
                        bgcolor: 'grey.300',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Iconify icon="eva:more-vertical-fill" width={18} />
                  </IconButton>
                </Tooltip>

                {/* ✅ Menú desplegable (sin cambios) */}
                <Menu
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={handleMenuClose}
                  onClick={(e) => e.stopPropagation()}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 0.5,
                        minWidth: 160,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }
                    }
                  }}
                >
                  {onAssign && (
                    <MenuItem 
                      onClick={handleAssign}
                      sx={{ 
                        gap: 1.5,
                        py: 1,
                        '&:hover': {
                          bgcolor: 'success.lighter',
                          color: 'success.main',
                        }
                      }}
                    >
                      <Iconify icon="mingcute:user-add-line" width={18} />
                      <Typography variant="body2" fontWeight={500}>
                        Asignar Empleados
                      </Typography>
                    </MenuItem>
                  )}

                  {onEdit && (
                    <MenuItem 
                      onClick={handleEdit}
                      sx={{ 
                        gap: 1.5,
                        py: 1,
                        '&:hover': {
                          bgcolor: 'primary.lighter',
                          color: 'primary.main',
                        }
                      }}
                    >
                      <Iconify icon="solar:pen-bold" width={18} />
                      <Typography variant="body2" fontWeight={500}>
                        Editar Cargo
                      </Typography>
                    </MenuItem>
                  )}

                  {onDelete && (onEdit || onAssign) && (
                    <Box sx={{ height: 1, bgcolor: 'divider', my: 0.5 }} />
                  )}

                  {onDelete && (
                    <MenuItem 
                      onClick={handleDelete}
                      sx={{ 
                        gap: 1.5,
                        py: 1,
                        '&:hover': {
                          bgcolor: 'error.lighter',
                          color: 'error.main',
                        }
                      }}
                    >
                      <Iconify icon="solar:trash-bin-minimalistic-bold" width={18} />
                      <Typography variant="body2" fontWeight={500}>
                        Eliminar Cargo
                      </Typography>
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
          </Box>

          {/* Línea 2: Código + Organización */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            pl: 7, // Alinear con el texto del nombre (Avatar width + gap)
          }}>
            {/* Código del cargo */}
            {data.positionCode && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon={"solar:code-line-duotone" as any} width={14} color="text.secondary" />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: data.organizationColor,
                    fontSize: '0.8125rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {data.positionCode}
                </Typography>
              </Box>
            )}

            {/* Separador visual */}
            {data.positionCode && (
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'divider' }} />
            )}

            {/* Organización */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon="solar:buildings-2-line-duotone" width={14} color="text.secondary" />
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                }}
              >
                {data.organizationName}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ✅ Resto del contenido (Departamento, Empleados, Skills) - sin cambios por ahora */}
        {data.functionalArea && (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.75,
                bgcolor: `${data.organizationColor}15`,
                color: data.organizationColor,
                borderRadius: 1.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: `${data.organizationColor}30`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: `${data.organizationColor}25`,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Iconify icon="solar:case-minimalistic-bold" width={14} />
              {data.functionalArea}
            </Box>
          </Box>
        )}

        {/* Empleados asignados - mantenemos igual por ahora */}
        {totalEmployees > 0 ? (
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                display: 'block', 
                mb: 1.5, 
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontSize: '0.625rem'
              }}
            >
              <Iconify icon="solar:users-group-rounded-line-duotone" width={12} sx={{ mr: 0.5 }} />
              Empleados Asignados ({totalEmployees})
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AvatarGroup
                max={5}
                sx={{
                  [`& .${avatarGroupClasses.avatar}`]: {
                    width: 28,
                    height: 28,
                    fontSize: '0.75rem',
                    border: '2px solid white',
                    bgcolor: data.organizationColor,
                    color: 'white',
                    fontWeight: 600,
                    transition: 'transform 0.2s ease',
                    cursor: 'help',
                    '&:hover': {
                      transform: 'scale(1.15)',
                      zIndex: 1,
                    }
                  },
                  '& .MuiAvatarGroup-avatar': {
                    bgcolor: `${data.organizationColor}80`,
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: data.organizationColor,
                      transform: 'scale(1.15)',
                    }
                  }
                }}
              >
                {activeEmployees.map((employee) => (
                  <Tooltip 
                    key={employee.id}
                    title={`${employee.firstName} ${employee.firstLastName} • ${employee.email}`}
                    arrow
                  >
                    <Avatar
                      src={employee.avatarUrl ?? undefined}
                      alt={`${employee.firstName} ${employee.firstLastName}`}
                    >
                      {employee.firstName.charAt(0)}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="caption" 
              color="text.disabled" 
              sx={{ 
                display: 'block', 
                mb: 1.5, 
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontSize: '0.625rem'
              }}
            >
              <Iconify icon="solar:users-group-rounded-line-duotone" width={12} sx={{ mr: 0.5 }} />
              Sin Empleados Asignados
            </Typography>
            
            <Box
              onClick={handleAssign}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                p: 1.5,
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 2,
                bgcolor: 'grey.50',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: data.organizationColor,
                  bgcolor: `${data.organizationColor}10`,
                  color: data.organizationColor,
                },
              }}
            >
              <Iconify icon="mingcute:user-add-line" width={20} color="inherit" />
              <Typography variant="caption" fontWeight={600} color="inherit">
                Hacer click para asignar empleados
              </Typography>
            </Box>
          </Box>
        )}

        {/* Skills principales - mantenemos igual por ahora */}
        {data.skills && data.skills.length > 0 && (
          <Box>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                display: 'block', 
                mb: 1.5, 
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontSize: '0.625rem'
              }}
            >
              <Iconify icon={"solar:star-line-duotone" as any} width={12} sx={{ mr: 0.5 }} />
              Habilidades Requeridas
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {data.skills.slice(0, 3).map((skill) => (
                <Box
                  key={skill}
                  sx={{
                    px: 1.25,
                    py: 0.5,
                    bgcolor: 'grey.100',
                    color: 'text.primary',
                    borderRadius: 1,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: `${data.organizationColor}15`,
                      borderColor: data.organizationColor,
                      color: data.organizationColor,
                      transform: 'translateY(-1px)',
                    }
                  }}
                >
                  {skill}
                </Box>
              ))}
              
              {data.skills.length > 3 && (
                <Tooltip 
                  title={
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Todas las habilidades:
                      </Typography>
                      {data.skills?.map((skill, index) => (
                        <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                          • {skill}
                        </Typography>
                      ))}
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      bgcolor: `${data.organizationColor}15`,
                      color: data.organizationColor,
                      borderRadius: 1,
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      cursor: 'help',
                      border: '1px solid',
                      borderColor: data.organizationColor,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: data.organizationColor,
                        color: 'white',
                        transform: 'translateY(-1px)',
                      }
                    }}
                  >
                    +{data.skills.length - 3} más
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}

        {/* ✅ Indicador de subordinados - MEJOR POSICIÓN */}
        {/* {data.isManagerial && data.children && data.children.length > 0 && (
          <Tooltip title={`Supervisa ${data.children.length} posiciones subordinadas`} arrow>
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: data.organizationColor,
                color: 'white',
                borderRadius: 1.5,
                px: 1,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 700,
                boxShadow: `0 2px 8px ${data.organizationColor}60`,
                border: '2px solid white',
                zIndex: 2,
                transition: 'all 0.3s ease',
                cursor: 'help',
                
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: `0 4px 12px ${data.organizationColor}80`,
                },
              }}
            >
              {data.children.length} Sub
            </Box>
          </Tooltip>
        )} */}

        {/* ✅ Indicador de vacante si no hay empleados */}
        {totalEmployees === 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'warning.main',
              color: 'white',
              borderRadius: 1.5,
              px: 1,
              py: 0.5,
              fontSize: '0.6875rem',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: '2px solid white',
              zIndex: 1,
            }}
          >
            Vacante
          </Box>
        )}
      </Card>
    </Box>
  );
}