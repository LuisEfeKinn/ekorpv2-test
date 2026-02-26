'use client';

import type {
  ModuleData,
  ModuleOption,
  PermissionItem,
  AvailablePermission,
  PermissionsTableProps
} from 'src/types/permissions';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';

import { useTranslate } from 'src/locales';
import {
  DeletePermissionService,
  GetRolePermissionsService,
  UpdateRolePermissionService,
  GetPermissionsRelatedDataService
} from 'src/services/security/permissions.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

export function PermissionsTable({ roleId, roleName }: PermissionsTableProps) {
  const { t } = useTranslate('security');
  const { t: tNav } = useTranslate('navbar');
  
  const [loading, setLoading] = useState(true);
  const [loadingModule, setLoadingModule] = useState(false);
  const [moduleOptions, setModuleOptions] = useState<ModuleOption[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<AvailablePermission[]>([]);

  // Mapeo simple para los íconos que llegan del backend
  const getModuleIcon = (iconName: string): string => {
    const iconMap: Record<string, string> = {
      dashboard: 'solar:widget-bold-duotone',
      users: 'solar:user-bold',
      building: 'solar:buildings-2-bold',
      shield: 'solar:shield-check-bold',
      settings: 'solar:settings-bold',
    };
    
    return iconMap[iconName?.toLowerCase().trim()] || 'solar:list-bold';
  };

  const getPermissionDisplayName = useCallback((permissionName: string): string => {
    const nameMap: Record<string, string> = {
      view: t('permissions.actions.view'),
      create: t('permissions.actions.create'),
      edit: t('permissions.actions.edit'),
      delete: t('permissions.actions.delete'),
      update: t('permissions.actions.edit'),
      read: t('permissions.actions.view'),
    };
    
    return nameMap[permissionName.toLowerCase()] || permissionName;
  }, [t]);

  const getPermissionIcon = useCallback((permissionName: string): string => {
    const iconMap: Record<string, string> = {
      view: 'solar:eye-bold',
      read: 'solar:eye-bold',
      create: 'solar:add-circle-bold',
      edit: 'solar:pen-bold',
      update: 'solar:pen-bold',
      delete: 'solar:trash-bin-trash-bold',
    };
    
    return iconMap[permissionName.toLowerCase()] || 'solar:shield-check-bold';
  }, []);

  const getPermissionColor = useCallback((permissionName: string): string => {
    const colorMap: Record<string, string> = {
      view: 'success',
      read: 'success',
      create: 'warning',
      edit: 'info',
      update: 'info',
      delete: 'error',
    };
    
    return colorMap[permissionName.toLowerCase()] || 'primary';
  }, []);

  // Cargar módulos disponibles al iniciar
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await GetPermissionsRelatedDataService({ roleId });
        
        if (response.data?.data) {
          const { modules, permissions } = response.data.data;
          
          // Establecer opciones de módulos con íconos
          setModuleOptions(modules?.map((module: any) => ({
            id: module.id,
            name: module.name,
            icon: getModuleIcon(module.icon)
          })) || []);
          
          // Procesar permisos usando las funciones helper directamente
          if (permissions && permissions.length > 0) {
            const processedPermissions = permissions.map((permission: any) => ({
              id: permission.id,
              name: getPermissionDisplayName(permission.name),
              icon: getPermissionIcon(permission.name),
              color: getPermissionColor(permission.name)
            }));
            setAvailablePermissions(processedPermissions);
          } else {
            setAvailablePermissions([]);
          }
          
          // Seleccionar el primer módulo por defecto
          if (modules && modules.length > 0) {
            setSelectedModule(modules[0].id);
          }
        } else {
          setModuleOptions([]);
          setAvailablePermissions([]);
        }
      } catch (error) {
        console.error('Error fetching modules:', error);
        toast.error(t('permissions.messages.error.loadingModules'));
        setModuleOptions([]);
        setAvailablePermissions([]);
      } finally {
        setLoading(false);
      }
    };

    if (roleId) {
      fetchModules();
    }
  }, [roleId, t, getPermissionDisplayName, getPermissionIcon, getPermissionColor]);

  // Cargar datos del módulo seleccionado
  const loadModuleData = useCallback(async (moduleId: string) => {
    if (!moduleId) return;

    try {
      setLoadingModule(true);
      const response = await GetRolePermissionsService({
        roleId,
        moduleId
      });

      if (response.data?.data !== null && response.data?.data !== undefined) {
        setModuleData(response.data.data);
      } else {
        setModuleData({ moduleId, moduleName: '', items: [] });
      }
    } catch (error) {
      console.error('Error fetching module data:', error);
      toast.error(t('permissions.messages.error.loading'));
      setModuleData({ moduleId, moduleName: '', items: [] });
    } finally {
      setLoadingModule(false);
    }
  }, [roleId, t]);

  // Cargar datos cuando cambia el módulo seleccionado
  useEffect(() => {
    if (selectedModule) {
      loadModuleData(selectedModule);
    }
  }, [selectedModule, loadModuleData]);

  // Manejar cambio de permiso (optimistic updates)
  const handlePermissionChange = async (
    itemId: string,
    permissionId: string,
    hasPermissionValue: boolean
  ) => {
    try {
      // Cambio optimista inmediato
      setModuleData(prevData => {
        if (!prevData) return prevData;
        
        return {
          ...prevData,
          items: prevData.items.map(item => {
            if (item.itemId === itemId) {
              if (!hasPermissionValue) {
                // Agregar permiso
                const permissionToAdd = availablePermissions.find(p => p.id === permissionId);
                return {
                  ...item,
                  permissions: [
                    ...item.permissions,
                    {
                      permissionId,
                      permissionName: permissionToAdd?.name || 'Permission'
                    }
                  ]
                };
              } else {
                // Quitar permiso
                return {
                  ...item,
                  permissions: item.permissions.filter(p => p.permissionId !== permissionId)
                };
              }
            }
            return item;
          })
        };
      });

      // Enviar al backend
      if (!hasPermissionValue) {
        await UpdateRolePermissionService({
          roleId: Number(roleId),
          itemId: Number(itemId),
          permissionId: Number(permissionId)
        });
      } else {
        const existingPermission = moduleData?.items
          .find(item => item.itemId === itemId)
          ?.permissions
          .find(p => p.permissionId === permissionId);

        if (existingPermission) {
          await DeletePermissionService(existingPermission.permissionId);
        }
      }

      toast.success(t('permissions.messages.success.updated'));

    } catch (error) {
      console.error('Error updating permission:', error);
      
      // Revertir cambio optimista en caso de error
      setModuleData(prevData => {
        if (!prevData) return prevData;
        
        return {
          ...prevData,
          items: prevData.items.map(item => {
            if (item.itemId === itemId) {
              if (hasPermissionValue) {
                // Si falló quitar, volver a agregar
                const permissionToRestore = availablePermissions.find(p => p.id === permissionId);
                return {
                  ...item,
                  permissions: [
                    ...item.permissions,
                    {
                      permissionId,
                      permissionName: permissionToRestore?.name || 'Permission'
                    }
                  ]
                };
              } else {
                // Si falló agregar, volver a quitar
                return {
                  ...item,
                  permissions: item.permissions.filter(p => p.permissionId !== permissionId)
                };
              }
            }
            return item;
          })
        };
      });

      toast.error(t('permissions.messages.error.updating'));
    }
  };

  // Verificar si un item tiene un permiso específico
  const hasPermission = (item: PermissionItem, permissionId: string): boolean => 
    item.permissions.some(p => p.permissionId === permissionId);

  // Obtener ícono del módulo actual
  const getCurrentModuleIcon = (): string => {
    const currentModule = moduleOptions.find(module => module.id === selectedModule);
    return currentModule?.icon || 'solar:list-bold';
  };

  // Estado de carga inicial
  if (loading) {
    return (
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:shield-check-bold" width={24} />
              <Typography variant="h6">
                {t('permissions.table.title')}
              </Typography>
            </Box>
          }
        />
        <LoadingScreen />
      </Card>
    );
  }

  // Sin módulos disponibles
  if (moduleOptions.length === 0) {
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
          subheader={t('permissions.table.subtitle')}
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
    <Card>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Iconify 
              icon="solar:shield-check-bold" 
              width={28} 
              sx={{ color: 'success.main' }}
            />
            <Typography variant="h6">
              {t('permissions.table.title')} {roleName && `- ${roleName}`}
            </Typography>
          </Stack>
        }
        subheader={t('permissions.table.subtitle')}
        action={
          <FormControl sx={{ minWidth: 250 }} size="small">
            <InputLabel>{t('permissions.table.selectModule')}</InputLabel>
            <Select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              label={t('permissions.table.selectModule')}
              disabled={loadingModule}
            >
              {moduleOptions.map((module) => (
                <MenuItem key={module.id} value={module.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Iconify icon={module.icon as any} width={16} />
                    {tNav(module.name) || module.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
        sx={{ pb: 2 }}
      />

      {loadingModule && (
        <Box sx={{ p: 3 }}>
          <LoadingScreen />
        </Box>
      )}

      {!loadingModule && moduleData && (
        <>
          {moduleData.moduleName && (
            <Box 
              sx={{ 
                mx: 3, 
                mb: 2, 
                p: 2, 
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Iconify icon={getCurrentModuleIcon() as any} width={20} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {tNav(moduleData.moduleName) || moduleData.moduleName}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
                {moduleData.items.length} {t('permissions.table.itemsCount')}
              </Typography>
            </Box>
          )}

          <TableContainer sx={{ 
            overflow: 'auto',
            maxWidth: '100%',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'grey.100',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'grey.300',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'grey.400',
            },
          }}>
            <Table sx={{ 
              minWidth: Math.max(800, 300 + (availablePermissions.length * 120))
            }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 300 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {t('permissions.table.item')}
                    </Typography>
                  </TableCell>
                  
                  {availablePermissions.length > 0 ? (
                    availablePermissions.map((permission) => (
                      <TableCell key={permission.id} align="center" sx={{ width: 120 }}>
                        <Stack direction="column" alignItems="center" spacing={0.5}>
                          <Iconify 
                            icon={permission.icon as any || 'solar:shield-check-bold'} 
                            width={20}
                            sx={{ color: `${permission.color || 'primary'}.main` }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {permission.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                    ))
                  ) : (
                    <TableCell align="center">
                      <Typography variant="caption" color="text.secondary">
                        {t('permissions.empty.noPermissionsAvailable')}
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              
              <TableBody>
                {moduleData.items.length > 0 ? (
                  moduleData.items.map((item) => (
                    <TableRow 
                      key={item.itemId} 
                      hover
                      sx={{
                        '&:hover': {
                          bgcolor: 'grey.50'
                        }
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            {tNav(item.itemName) || item.itemName}
                          </Typography>
                          {item.permissions.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {item.permissions.map((perm) => (
                                <Chip
                                  key={perm.permissionId}
                                  label={getPermissionDisplayName(perm.permissionName)}
                                  size="small"
                                  color="primary"
                                  variant="soft"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      
                      {availablePermissions.map((permission) => {
                        const hasPermissionValue = hasPermission(item, permission.id);
                        
                        return (
                          <TableCell key={permission.id} align="center">
                            <Tooltip 
                              title={`${permission.name} ${tNav(item.itemName) || item.itemName}`}
                              arrow
                            >
                              <Switch
                                checked={hasPermissionValue}
                                onChange={() => 
                                  handlePermissionChange(
                                    item.itemId, 
                                    permission.id, 
                                    hasPermissionValue
                                  )
                                }
                                color={permission.color as any}
                                size="small"
                                sx={{
                                  '& .MuiSwitch-thumb': {
                                    boxShadow: 2
                                  }
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell 
                      colSpan={availablePermissions.length + 1} 
                      sx={{ border: 0, p: 0 }}
                    >
                      <EmptyContent
                        filled
                        title={t('permissions.empty.noItems')}
                        description={t('permissions.empty.noItemsDescription')}
                        sx={{ py: 6 }}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Card>
  );
}