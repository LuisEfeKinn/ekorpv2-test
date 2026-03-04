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

export interface EmployeeNodeData extends OrganizationPosition {
  level?: number;
  isCollapsed?: boolean;
  hasChildren?: boolean;
  onEdit?: (position: OrganizationPosition) => void;
  onDelete?: (position: OrganizationPosition) => void;
  onAssign?: (position: OrganizationPosition) => void;
  onToggleCollapse?: (positionId: string) => void;
  readonly?: boolean;
}

type Props = {
  data: EmployeeNodeData;
  selected?: boolean;
  sx?: object;
  disableHoverTransform?: boolean;
};

export function EmployeeNodeCard({ data: nodeData, selected, sx, disableHoverTransform }: Props) {
  const { t } = useTranslate('organization');

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => { 
    setAnchorEl(null); 
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    nodeData.onEdit?.(nodeData);
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    setConfirmDeleteOpen(false);
    nodeData.onDelete?.(nodeData);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
  };

  const handleAssign = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    nodeData.onAssign?.(nodeData);
  };

  const getPositionInitial = (name: string) => 
    name.charAt(0).toUpperCase();

  const activeEmployees = nodeData.assignedEmployees?.filter((emp: any) => emp.isActive) || [];
  const totalEmployees = activeEmployees.length;
  const totalVacancies = nodeData.vacancies || 0;
  const requiredEmployees = nodeData.requiredEmployees || 0;
  const hasVacancies = totalVacancies > 0;
  const hasNoEmployees = totalEmployees === 0;

  return (
    <>
      <Card
        sx={{
          overflow: 'hidden',
          minWidth: 360,
          maxWidth: 420,
          cursor: 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          bgcolor: 'background.paper',
          boxShadow: selected 
            ? '0 8px 30px rgba(0,0,0,0.15)' 
            : '0 4px 20px rgba(0,0,0,0.08)',
          borderRadius: 3,
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            transform: !disableHoverTransform ? 'translateY(-4px)' : 'none',
            borderColor: nodeData.organizationColor,
          },
          ...sx,
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
              bgcolor: nodeData.organizationColor,
              borderRadius: '12px 12px 0 0',
            }
          }}
        >
          <Box sx={{ p: 2.5, pt: 3.5 }}>
            {/* Avatar + Nombre + Acciones */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={nodeData.positionImage ?? undefined}
                  sx={{ 
                    width: 60, 
                    height: 60,
                    border: '4px solid',
                    borderColor: `${nodeData.organizationColor}20`,
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    bgcolor: `${nodeData.organizationColor}15`,
                    color: nodeData.organizationColor,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {getPositionInitial(nodeData.name)}
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
                <Tooltip title={nodeData.name.length > 25 ? nodeData.name : ''} arrow>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      lineHeight: 1.2,
                      color: 'text.primary',
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {nodeData.name}
                  </Typography>
                </Tooltip>

                {/* Código de posición */}
                {nodeData.positionCode && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: nodeData.organizationColor,
                      bgcolor: `${nodeData.organizationColor}10`,
                      px: 1,
                      py: 0.25,
                      borderRadius: 0.5,
                      width: 'fit-content',
                      mb: 0.5,
                    }}
                  >
                    #{nodeData.positionCode}
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
                  {nodeData.organizationName}
                </Typography>
              </Box>

              {/* Controles de la derecha */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {/* Botón de colapsar/expandir individual */}
                {nodeData.hasChildren && nodeData.onToggleCollapse && (
                  <Tooltip 
                    title={nodeData.isCollapsed 
                      ? t('organigrama.nodeActions.expandNode') 
                      : t('organigrama.nodeActions.collapseNode')} 
                    arrow
                  >
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        nodeData.onToggleCollapse?.(nodeData.positionId);
                      }}
                      sx={{ 
                        width: 32,
                        height: 32,
                        color: 'text.secondary',
                        bgcolor: `${nodeData.organizationColor}10`,
                        '&:hover': { 
                          bgcolor: nodeData.organizationColor,
                          color: 'white',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Iconify 
                        icon={nodeData.isCollapsed ? "eva:plus-fill" : "eva:minus-fill"} 
                        width={16} 
                      />
                    </IconButton>
                  </Tooltip>
                )}

                {/* Botón de acciones */}
                {!nodeData.readonly && (nodeData.onEdit || nodeData.onDelete || nodeData.onAssign) && (
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
                          bgcolor: nodeData.organizationColor,
                          color: 'white',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Iconify icon="eva:more-vertical-fill" width={18} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Área Funcional */}
            {nodeData.functionalArea && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 0.75,
                    bgcolor: `${nodeData.organizationColor}08`,
                    color: nodeData.organizationColor,
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: nodeData.organizationColor,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: nodeData.organizationColor,
                      bgcolor: `${nodeData.organizationColor}08`,
                      color: nodeData.organizationColor,
                    },
                  }}
                >
                  <Iconify icon="solar:case-minimalistic-bold" width={14} />
                  {nodeData.functionalArea}
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Separador visual */}
        <Divider sx={{ borderColor: `${nodeData.organizationColor}20` }} />

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
                  <Iconify icon="solar:users-group-rounded-bold" width={16} color={nodeData.organizationColor} />
                  {t('organigrama.nodeContent.assignedTeam')}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`${totalEmployees}/${requiredEmployees}`}
                    size="small"
                    sx={{
                      bgcolor: `${nodeData.organizationColor}15`,
                      color: nodeData.organizationColor,
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
                    justifyContent: 'flex-start',
                    [`& .${avatarGroupClasses.avatar}`]: {
                      width: 32,
                      height: 32,
                      fontSize: '0.8rem',
                      border: '2px solid white',
                    },
                  }}
                >
                  {activeEmployees.map((employee: any) => (
                    <Tooltip key={employee.employeeId} title={`${employee.firstName} ${employee.firstLastName}`} arrow>
                      <Avatar
                        src={employee.avatarUrl || undefined}
                        sx={{ 
                          bgcolor: nodeData.organizationColor,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      >
                        {`${employee.firstName?.[0]}${employee.firstLastName?.[0]}`}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Box>
            </Box>
          ) : (
            /* Sin empleados - mostrar estado vacío */
            nodeData.onAssign && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleAssign}
                  startIcon={<Iconify icon="mingcute:user-add-line" width={20} />}
                  sx={{
                    borderColor: nodeData.organizationColor,
                    color: nodeData.organizationColor,
                    '&:hover': {
                      bgcolor: nodeData.organizationColor,
                      borderColor: nodeData.organizationColor,
                    },
                  }}
                >
                  {t('organigrama.nodeActions.assignEmployees')}
                </Button>
              </Box>
            )
          )}

          {/* Skills principales */}
          {nodeData.skills && nodeData.skills.length > 0 && (
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
                <Iconify icon="solar:star-bold" width={16} color={nodeData.organizationColor} />
                {t('organigrama.nodeContent.keySkills')}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {nodeData.skills.slice(0, 3).map((skill) => (
                  <Box
                    key={skill}
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: 'action.hover',
                      color: 'text.primary',
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: '1px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: `${nodeData.organizationColor}15`,
                        borderColor: `${nodeData.organizationColor}50`,
                        color: nodeData.organizationColor,
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    {skill}
                  </Box>
                ))}
                
                {nodeData.skills.length > 3 && (
                  <Tooltip 
                    title={
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          {t('organigrama.nodeContent.allRequiredSkills')}
                        </Typography>
                        {nodeData.skills?.map((skill, index) => (
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
                        bgcolor: 'action.hover',
                        color: 'text.primary',
                        borderRadius: 2,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        border: '1px solid transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: `${nodeData.organizationColor}15`,
                          borderColor: `${nodeData.organizationColor}50`,
                          color: nodeData.organizationColor,
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      +{nodeData.skills.length - 3} {t('organigrama.nodeContent.moreSkills')}
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Card>

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
        {nodeData.onEdit && (
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
        {nodeData.onDelete && (nodeData.onEdit || nodeData.onAssign) && (
          <Divider sx={{ my: 0.5 }} />
        )}
        {nodeData.onDelete && (
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

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
        title={t('organigrama.deleteDialog.title')}
        content={
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('organigrama.deleteDialog.message', { name: nodeData.name })}
            </Typography>

            {activeEmployees.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'warning.lighter',
                  color: 'warning.darker',
                  border: '1px solid',
                  borderColor: 'warning.light',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Iconify icon="solar:danger-triangle-bold" width={20} />
                  <Typography variant="subtitle2">
                    {t('organigrama.deleteDialog.warning')}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  {t('organigrama.deleteDialog.employeesWarning', { count: activeEmployees.length })}
                </Typography>
              </Box>
            )}
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            {t('organigrama.deleteDialog.confirmButton')}
          </Button>
        }
      />
    </>
  );
}
