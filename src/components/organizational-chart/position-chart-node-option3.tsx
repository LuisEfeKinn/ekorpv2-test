'use client';

import type { BoxProps } from '@mui/material/Box';
import type { OrganizationPosition } from 'src/types/organizational-chart-position';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AvatarGroup, { avatarGroupClasses } from '@mui/material/AvatarGroup';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

interface Props extends BoxProps {
  data: OrganizationPosition;
  onEdit?: (position: OrganizationPosition) => void;
  onDelete?: (position: OrganizationPosition) => void;
  onAssign?: (position: OrganizationPosition) => void;
  readonly?: boolean;
}

export function PositionChartNodeOption3({ 
  data, 
  onEdit, 
  onDelete, 
  onAssign,
  readonly = false,
  sx, 
  ...other 
}: Props) {
  const { t } = useTranslate('organization');

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event?: {}, reason?: "backdropClick" | "escapeKeyDown") => { 
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
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    setConfirmDeleteOpen(false);
    onDelete?.(data);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
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
  const totalVacancies = data.vacancies || 0;
  const requiredEmployees = data.requiredEmployees || 0;
  const hasVacancies = totalVacancies > 0;
  const hasNoEmployees = totalEmployees === 0;

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
        {/* ✨ OPCIÓN 3: Header limpio con línea superior y diseño minimalista */}
        <Box
          sx={{
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              bgcolor: data.organizationColor,
              borderRadius: '12px 12px 0 0',
            }
          }}
        >
          <Box sx={{ p: 2.5, pt: 3.5 }}>
            {/* Avatar + Nombre + Acciones */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={data.positionImage ?? undefined}
                  sx={{ 
                    width: 60, 
                    height: 60,
                    border: '4px solid',
                    borderColor: `${data.organizationColor}20`,
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    bgcolor: `${data.organizationColor}15`,
                    color: data.organizationColor,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {getPositionInitial(data.name)}
                </Avatar>
                
                {/* Dot indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    bgcolor: hasNoEmployees ? 'error.main' : hasVacancies ? 'warning.main' : 'success.main',
                    borderRadius: '50%',
                    border: '3px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    lineHeight: 1.2,
                    color: 'text.primary',
                    mb: 0.5,
                  }}
                >
                  {data.name}
                </Typography>

                {/* Código y Organización en líneas separadas */}
                {data.positionCode && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: data.organizationColor,
                      bgcolor: `${data.organizationColor}10`,
                      px: 1,
                      py: 0.25,
                      borderRadius: 0.5,
                      width: 'fit-content',
                      mb: 0.5,
                    }}
                  >
                    #{data.positionCode}
                  </Typography>
                )}
                
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Iconify icon="solar:buildings-2-line-duotone" width={14} />
                  {data.organizationName}
                </Typography>
              </Box>

              {/* Botón de acciones */}
              {!readonly && (onEdit || onDelete || onAssign) && (
                <>
                  <Tooltip title={t('organigrama.nodeActions.moreOptions')} arrow>
                    <IconButton 
                      size="small"
                      onClick={handleMenuOpen}
                      disableRipple
                      sx={{ 
                        width: 36,
                        height: 36,
                        color: 'text.primary',
                        '&:hover': { 
                          bgcolor: data.organizationColor,
                          color: 'white',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
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
                          {t('organigrama.nodeActions.editPosition')}
                        </Typography>
                      </MenuItem>
                    )}
                    {onDelete && (onEdit || onAssign) && (
                      <Divider sx={{ my: 0.5 }} />
                    )}
                    {onDelete && (
                      <MenuItem 
                        onClick={handleDelete} 
                        sx={{ 
                          gap: 1.5, 
                          py: 1,
                          borderBottomLeftRadius: '12px',
                          borderBottomRightRadius: '12px',
                          '&:hover': {
                            bgcolor: 'error.lighter',
                            color: 'error.main',
                          }
                        }}
                      >
                        <Iconify icon="solar:trash-bin-minimalistic-bold" width={18} />
                        <Typography variant="body2" fontWeight={500}>
                          {t('organigrama.nodeActions.deletePosition')}
                        </Typography>
                      </MenuItem>
                    )}
                  </Menu>
                </>
              )}
            </Box>

            {/* Área Funcional */}
            {data.functionalArea && (
              <Box>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 0.75,
                    bgcolor: `${data.organizationColor}08`,
                    color: data.organizationColor,
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: data.organizationColor,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: data.organizationColor,
                      bgcolor: `${data.organizationColor}08`,
                      color: data.organizationColor,
                    },
                  }}
                >
                  <Iconify icon="solar:case-minimalistic-bold" width={14} />
                  {data.functionalArea}
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Separador visual */}
        <Divider sx={{ borderColor: `${data.organizationColor}20` }} />

        {/* Contenido del cuerpo */}
        <Box sx={{ p: 2.5 }}>
          {/* Empleados asignados */}
          {totalEmployees > 0 ? (
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  color="text.primary" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  <Iconify icon="solar:users-group-rounded-bold" width={16} color={data.organizationColor} />
                  {t('organigrama.nodeContent.assignedTeam')}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`${totalEmployees}/${requiredEmployees}`}
                    size="small"
                    sx={{
                      bgcolor: `${data.organizationColor}15`,
                      color: data.organizationColor,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 22,
                    }}
                  />
                  
                  {hasVacancies && (
                    <Chip
                      label={`${totalVacancies} ${t('organigrama.nodeContent.vacancies')}`}
                      size="small"
                      color="warning"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 22,
                      }}
                    />
                  )}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AvatarGroup
                  max={4}
                  sx={{
                    [`& .${avatarGroupClasses.avatar}`]: {
                      width: 36,
                      height: 36,
                      fontSize: '0.85rem',
                      border: '3px solid white',
                      bgcolor: data.organizationColor,
                      color: 'white',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      cursor: 'help',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      '&:hover': {
                        transform: 'scale(1.25) translateY(-4px)',
                        zIndex: 2,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                      }
                    },
                    '& .MuiAvatarGroup-avatar': {
                      bgcolor: `${data.organizationColor}90`,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }
                  }}
                >
                  {activeEmployees.map((employee) => (
                    <Tooltip 
                      key={employee.id}
                      title={
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {employee.firstName} {employee.firstLastName}
                          </Typography>
                          <Typography variant="caption" color="inherit">
                            {employee.email}
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  color="text.disabled" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  <Iconify icon="solar:users-group-rounded-line-duotone" width={16} />
                  {t('organigrama.nodeContent.noTeamAssigned')}
                </Typography>
                
                <Chip
                  label={`${requiredEmployees} ${t('organigrama.nodeContent.required')}`}
                  size="small"
                  color="error"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
              </Box>
              
              <Box
                onClick={handleAssign}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  p: 2,
                  border: '2px dashed',
                  borderColor: 'error.main',
                  borderRadius: 2.5,
                  bgcolor: 'error.lighter',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'error.main',
                    bgcolor: 'error.main',
                    color: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Iconify icon="mingcute:user-add-line" width={24} color="inherit" />
                <Typography variant="body2" fontWeight={600} color="inherit">
                  {t('organigrama.nodeContent.assignEmployees')}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Skills principales */}
          {data.skills && data.skills.length > 0 && (
            <Box>
              <Typography 
                variant="subtitle2" 
                color="text.primary" 
                sx={{ 
                  mb: 1.5,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                }}
              >
                <Iconify icon="solar:star-bold" width={16} color={data.organizationColor} />
                {t('organigrama.nodeContent.keySkills')}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {data.skills.slice(0, 3).map((skill) => (
                  <Box
                    key={skill}
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: 'grey.100',
                      color: 'text.primary',
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: '1px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: `${data.organizationColor}15`,
                        borderColor: `${data.organizationColor}50`,
                        color: data.organizationColor,
                        transform: 'translateY(-2px)',
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
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          {t('organigrama.nodeContent.allRequiredSkills')}
                        </Typography>
                        {data.skills?.map((skill, index) => (
                          <Typography key={index} variant="caption" sx={{ display: 'block', mb: 0.25 }}>
                            • {skill}
                          </Typography>
                        ))}
                      </Box>
                    }
                    arrow
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        bgcolor: 'grey.100',
                        color: 'text.primary',
                        borderRadius: 2,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        border: '1px solid transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: `${data.organizationColor}15`,
                          borderColor: `${data.organizationColor}50`,
                          color: data.organizationColor,
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      +{data.skills.length - 3} {t('organigrama.nodeContent.moreSkills')}
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Card>

      {/* Modal de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'error.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="solar:trash-bin-minimalistic-bold" width={24} color="error.main" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('organigrama.deleteDialog.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.name}
              </Typography>
            </Box>
          </Box>
        }
        content={
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
              {t('organigrama.deleteDialog.message', { name: data.name })}
            </Typography>
            
            {data.assignedEmployees && data.assignedEmployees.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'warning.lighter',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'warning.main',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Iconify icon="solar:danger-triangle-bold" width={20} color="warning.main" />
                  <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 600 }}>
                    {t('organigrama.deleteDialog.warning')}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {t('organigrama.deleteDialog.employeesWarning', { count: data.assignedEmployees.length })}
                </Typography>
              </Box>
            )}
          </Box>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            startIcon={<Iconify icon="solar:trash-bin-minimalistic-bold" width={18} />}
            sx={{ fontWeight: 600 }}
          >
            {t('organigrama.deleteDialog.confirmButton')}
          </Button>
        }
      />
    </Box>
  );
}