'use client';

import type { BoxProps } from '@mui/material/Box';
import type { OrganizationPosition } from 'src/types/organizational-chart-position';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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

export function PositionChartNodeOption1({ 
  data, 
  onEdit, 
  onDelete, 
  onAssign,
  readonly = false,
  sx, 
  ...other 
}: Props) {

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

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

  const getPositionInitial = (name: string) => 
    name.charAt(0).toUpperCase();

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
          overflow: 'hidden',
          minWidth: 340,
          maxWidth: 400,
          cursor: 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderRadius: 3,
          
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            transform: 'translateY(-4px)',
            borderColor: data.organizationColor,
          },
        }}
      >
        {/* ✨ OPCIÓN 1: Header con gradiente de fondo */}
        <Box
          sx={{
            background: `linear-gradient(
              135deg,
              ${data.organizationColor}20 0%,  /* ~25% opacidad */
              ${data.organizationColor}10 100% /* ~6% opacidad */
            )`,
            borderBottom: '1px solid',
            borderColor: `${data.organizationColor}20`,
            p: 2.5,
            pb: 2,
          }}
        >
          {/* Avatar + Nombre + Acciones */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar
              src={data.positionImage ?? undefined}
              sx={{ 
                width: 52, 
                height: 52,
                border: '3px solid white',
                fontSize: '1.1rem',
                fontWeight: 700,
                bgcolor: data.organizationColor,
                color: 'white',
                boxShadow: `0 4px 12px ${data.organizationColor}40`,
              }}
            >
              {getPositionInitial(data.name)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  lineHeight: 1.2,
                  color: 'text.primary',
                  mb: 0.5,
                }}
              >
                {data.name}
              </Typography>

              {/* Código + Organización */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {data.positionCode && (
                  <Chip
                    label={data.positionCode}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      bgcolor: data.organizationColor,
                      color: 'white',
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                )}
                
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Iconify icon="solar:buildings-2-line-duotone" width={12} />
                  {data.organizationName}
                </Typography>
              </Box>
            </Box>

            {/* Botón de acciones */}
            {!readonly && (onEdit || onDelete || onAssign) && (
              <>
                <Tooltip title="Más opciones" arrow>
                  <IconButton 
                    size="small"
                    onClick={handleMenuOpen}
                    sx={{ 
                      width: 36,
                      height: 36,

                      backdropFilter: 'blur(10px)',
                      border: '1px solid',
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: 'text.primary',
                      '&:hover': { 
                        bgcolor: 'white',
                        transform: 'scale(1.05)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    <Iconify icon="eva:more-vertical-fill" width={18} />
                  </IconButton>
                </Tooltip>

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
                    <MenuItem onClick={handleAssign} sx={{ gap: 1.5, py: 1 }}>
                      <Iconify icon="mingcute:user-add-line" width={18} />
                      <Typography variant="body2" fontWeight={500}>
                        Asignar Empleados
                      </Typography>
                    </MenuItem>
                  )}
                  {onEdit && (
                    <MenuItem onClick={handleEdit} sx={{ gap: 1.5, py: 1 }}>
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
                    <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1 }}>
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
        </Box>

        {/* Contenido del cuerpo */}
        <Box sx={{ p: 2.5 }}>
          {/* Área funcional */}
          {data.functionalArea && (
            <Box sx={{ mb: 2.5 }}>
              <Chip
                icon={<Iconify icon="solar:case-minimalistic-bold" width={14} />}
                label={data.functionalArea}
                variant="outlined"
                sx={{
                  borderColor: data.organizationColor,
                  color: data.organizationColor,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: `${data.organizationColor}10`,
                  }
                }}
              />
            </Box>
          )}

          {/* Empleados asignados */}
          {totalEmployees > 0 ? (
            <Box sx={{ mb: 2.5 }}>
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
            <Box sx={{ mb: 2.5 }}>
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

          {/* Skills principales */}
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
                  <Chip
                    key={skill}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      borderColor: 'grey.300',
                      '&:hover': {
                        borderColor: data.organizationColor,
                        bgcolor: `${data.organizationColor}10`,
                      }
                    }}
                  />
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
                  >
                    <Chip
                      label={`+${data.skills.length - 3} más`}
                      size="small"
                      sx={{
                        bgcolor: data.organizationColor,
                        color: 'white',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        cursor: 'help',
                        '&:hover': {
                          bgcolor: data.organizationColor,
                          transform: 'scale(1.05)',
                        }
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Indicadores */}
        {totalEmployees === 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: 'warning.main',
              color: 'white',
              borderRadius: 1,
              px: 1,
              py: 0.25,
              fontSize: '0.6875rem',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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