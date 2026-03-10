'use client';

import type { OrganizationPosition } from 'src/types/organizational-chart-position';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { 
  OrganizationalChartService 
} from 'src/services/organization/organizational-chart.service';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { OrganizationSkillsDialog } from './organization-skills-dialog';
import { OrganizationEmployeesDialog } from './organization-employees-dialog';

// ----------------------------------------------------------------------

const ORGANIZATIONS = [
  { id: 'org-1', name: 'Matriz Principal', color: '#1976d2' },
  { id: 'org-2', name: 'División Tecnología', color: '#2e7d32' },
  { id: 'org-3', name: 'División Financiera', color: '#ed6c02' },
  { id: 'org-4', name: 'Sucursal Norte', color: '#9c27b0' },
  { id: 'org-5', name: 'Sucursal Sur', color: '#f57c00' },
];

const LOCATIONS = [
  { id: 'sede-principal', name: 'Sede Principal' },
  { id: 'sucursal-norte', name: 'Sucursal Norte' },
  { id: 'sucursal-sur', name: 'Sucursal Sur' },
  { id: 'sucursal-centro', name: 'Sucursal Centro' },
  { id: 'oficina-remota', name: 'Oficina Remota' },
];

const HIERARCHICAL_LEVELS = [
  { value: 'alta_direccion', label: 'Alta Dirección' },
  { value: 'gerencial', label: 'Gerencial' },
  { value: 'ejecutivo', label: 'Ejecutivo' },
  { value: 'operativo', label: 'Operativo' },
];

const BlockLabel = styled('span')(({ theme }) => ({
  ...theme.typography.caption,
  width: 120,
  flexShrink: 0,
  color: theme.vars.palette.text.secondary,
  fontWeight: theme.typography.fontWeightSemiBold,
}));

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  editData?: OrganizationPosition | null;
};

export function PositionCreateDrawer({ open, onClose, editData }: Props) {
  const { t } = useTranslate('organization');
  
  // ✅ Estados actualizados
  const [organizationId, setOrganizationId] = useState('');
  const [parentPositionId, setParentPositionId] = useState<string>(''); // ✅ Reemplaza level
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // ✅ Nuevos estados
  const [location, setLocation] = useState('');
  const [hierarchicalLevel, setHierarchicalLevel] = useState('');
  const [requiredEmployees, setRequiredEmployees] = useState<number>(1);
  
  // ✅ Cálculo de vacantes (no se envía al backend)
  const availableVacancies = Math.max(0, requiredEmployees - assignedEmployees.length);
  
  // ✅ Nuevo estado para cargos disponibles como padres
  const [availableParentPositions, setAvailableParentPositions] = useState<OrganizationPosition[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // Dialogs
  const skillsDialog = useBoolean();
  const employeesDialog = useBoolean();

  // ✅ Cargar cargos disponibles para ser padre
  const loadAvailableParentPositions = useCallback(async () => {
    try {
      setLoadingParents(true);
      
      // ✅ Obtener lista de cargos (puedes implementar un endpoint específico)
      const response = await OrganizationalChartService.getOrganizationalChart();
      
      // ✅ Función helper para aplanar el árbol de cargos
      const flattenPositions = (position: OrganizationPosition): OrganizationPosition[] => {
        const result = [position];
        if (position.children) {
          position.children.forEach(child => {
            result.push(...flattenPositions(child));
          });
        }
        return result;
      };
      
      const allPositions = flattenPositions(response.data.root);
      
      // ✅ Filtrar el cargo actual si estamos editando (no puede ser padre de sí mismo)
      const filteredPositions = editData 
        ? allPositions.filter(pos => pos.id !== editData.id)
        : allPositions;
        
      setAvailableParentPositions(filteredPositions);
    } catch (error) {
      console.error('Error loading parent positions:', error);
      // ✅ Fallback con datos mock
      setAvailableParentPositions([]);
    } finally {
      setLoadingParents(false);
    }
  }, [editData]);

  useEffect(() => {
    if (open) {
      loadAvailableParentPositions();
    }
  }, [open, loadAvailableParentPositions]);

  // ✅ Efecto para cargar datos de edición actualizado
  useEffect(() => {
    if (editData && open) {
      setOrganizationId(editData.organizationId || '');
      setName(editData.name || '');
      setParentPositionId(editData.parentPositionId || ''); // ✅ Usar parentPositionId
      setCode(editData.positionCode || '');
      setDescription(editData.description || '');
      setSelectedSkills(editData.skills || []);
      setAssignedEmployees(editData.assignedEmployees || []);
      // ✅ Nuevos campos
      setLocation(editData.location || '');
      setHierarchicalLevel(editData.hierarchicalLevel || '');
      setRequiredEmployees(editData.requiredEmployees || 1);
    } else if (open && !editData) {
      setOrganizationId('');
      setParentPositionId(''); // ✅ Limpiar parentPositionId
      setCode('');
      setName('');
      setDescription('');
      setSelectedSkills([]);
      setAssignedEmployees([]);
      // ✅ Limpiar nuevos campos
      setLocation('');
      setHierarchicalLevel('');
      setRequiredEmployees(1);
    }
  }, [editData, open]);

  const handleAddSkill = (skill: string) => {
    const isAlreadySelected = selectedSkills.includes(skill);
    
    if (isAlreadySelected) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  };

  const handleAddEmployee = (employee: any) => {
    const isAlreadySelected = assignedEmployees.find(emp => emp.id === employee.id);
    
    if (isAlreadySelected) {
      setAssignedEmployees(prev => prev.filter(emp => emp.id !== employee.id));
    } else {
      setAssignedEmployees(prev => [...prev, employee]);
    }
  };

  const handleRemoveEmployee = (employeeId: string) => {
    setAssignedEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };

  // ✅ Actualizar handleSave
  const handleSave = useCallback(async () => {
    try {
      setLoading(true);

      const positionData = {
        name,
        parentPositionId: parentPositionId || null, // ✅ null si es cargo raíz
        positionCode: code,
        description,
        skills: selectedSkills,
        assignedEmployees: assignedEmployees.map(emp => emp.id),
        organizationId,
        // ✅ Nuevos campos
        location,
        hierarchicalLevel,
        requiredEmployees,
      };

      if (editData) {
        await OrganizationalChartService.updatePosition({
          id: editData.id,
          ...positionData,
        });
        console.log('✅ Cargo actualizado');
      } else {
        await OrganizationalChartService.createPosition(positionData);
        console.log('✅ Cargo creado');
      }

      onClose();
    } catch (error) {
      console.error('Error saving position:', error);
      alert(t('organigrama.messages.saveError'));
    } finally {
      setLoading(false);
    }
  }, [editData, organizationId, parentPositionId, code, name, description, selectedSkills, assignedEmployees, location, hierarchicalLevel, requiredEmployees, onClose, t]);

  const renderToolbar = () => (
    <Box
      sx={{
        px: 2.5,
        py: 2,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: editData ? 'warning.main' : 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify 
            icon={editData ? "solar:pen-bold" : "mingcute:add-line"}
            sx={{ 
              color: 'white', 
              width: 18,
              transition: 'transform 0.3s ease',
            }} 
          />
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {editData ? t('organigrama.drawer.editPosition.title') : t('organigrama.drawer.createPosition.title')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {editData 
              ? t('organigrama.drawer.editPosition.subtitle')
              : t('organigrama.drawer.createPosition.subtitle')
            }
          </Typography>
        </Box>
        
        {/* ✅ Indicador de Vacantes */}
        {(editData && requiredEmployees > 0) && (
          <Chip
            icon={
              <Iconify 
                icon={availableVacancies > 0 ? "solar:user-plus-bold" : "solar:users-group-rounded-bold"}
                sx={{ width: 16, height: 16, color: 'text.secondary' }}
              />
            }
            label={
              availableVacancies > 0 
                ? `${availableVacancies} ${t('organigrama.drawer.vacancies.label')}`
                : t('organigrama.drawer.vacancies.full')
            }
            variant="soft"
            size="small"
            sx={{
              mr: 1,
              maxWidth: 120,
              px: 0.5,
              py: 2,
              bgcolor: availableVacancies > 0 ? 'warning.lighter' : 'grey.100',
              color: availableVacancies > 0 ? 'warning.main' : 'text.secondary',
              fontWeight: 500,
              boxShadow: 0,
              '& .MuiChip-label': {
                fontSize: '0.75rem',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                lineHeight: 1.2,
                px: 0.5,
              },
            }}
          />
        )}
      </Box>
      
      <IconButton 
        onClick={onClose}
        sx={{
          color: 'text.secondary',
          '&:hover': {
            bgcolor: 'error.lighter',
            color: 'error.main',
          }
        }}
      >
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Box>
  );

  const renderContent = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      {/* Unidad Organizacional */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.organization.label')}</BlockLabel>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>{t('organigrama.form.fields.organization.placeholder')}</InputLabel>
            <Select
              value={organizationId}
              label={t('organigrama.form.fields.organization.placeholder')}
              onChange={(e) => setOrganizationId(e.target.value)}
            >
              {ORGANIZATIONS.map((org) => (
                <MenuItem key={org.id} value={org.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: org.color,
                      }}
                    />
                    {org.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Tooltip title={t('organigrama.form.fields.organization.create')}>
            <IconButton
              size="small"
              sx={[
                (theme) => ({
                  border: `dashed 1px ${theme.vars.palette.divider}`,
                  bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                }),
              ]}
            >
              <Iconify icon="mingcute:add-line" width={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ✅ Cargo Padre (reemplaza Nivel) */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.parentPosition.label')}</BlockLabel>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel>{t('organigrama.form.fields.parentPosition.placeholder')}</InputLabel>
          <Select
            value={parentPositionId}
            label={t('organigrama.form.fields.parentPosition.placeholder')}
            onChange={(e) => setParentPositionId(e.target.value)}
            disabled={loadingParents}
          >
            <MenuItem value="">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="solar:crown-bold" width={16} sx={{ color: 'warning.main' }} />
                <em style={{ color: '#666' }}>{t('organigrama.form.fields.parentPosition.rootPosition')}</em>
              </Box>
            </MenuItem>
            
            {availableParentPositions.map((position) => (
              <MenuItem key={position.id} value={position.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: position.organizationColor,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {position.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {position.positionCode || position.organizationName}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
          
          {loadingParents && (
            <Box sx={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)' }}>
              <CircularProgress size={16} />
            </Box>
          )}
        </FormControl>
      </Box>

      {/* ✅ Sede / Ubicación */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.location.label')}</BlockLabel>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel>{t('organigrama.form.fields.location.placeholder')}</InputLabel>
          <Select
            value={location}
            label={t('organigrama.form.fields.location.placeholder')}
            onChange={(e) => setLocation(e.target.value)}
          >
            {LOCATIONS.map((loc) => (
              <MenuItem key={loc.id} value={loc.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:flag-bold" width={16} sx={{ color: 'primary.main' }} />
                  {loc.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* ✅ Nivel Jerárquico */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.hierarchicalLevel.label')}</BlockLabel>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel>{t('organigrama.form.fields.hierarchicalLevel.placeholder')}</InputLabel>
          <Select
            value={hierarchicalLevel}
            label={t('organigrama.form.fields.hierarchicalLevel.placeholder')}
            onChange={(e) => setHierarchicalLevel(e.target.value)}
          >
            {HIERARCHICAL_LEVELS.map((level) => (
              <MenuItem key={level.value} value={level.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: level.value === 'alta_direccion' ? 'error.main' : 
                               level.value === 'gerencial' ? 'warning.main' :
                               level.value === 'ejecutivo' ? 'info.main' : 'success.main',
                    }}
                  />
                  {level.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Código */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.code.label')}</BlockLabel>
        <TextField
          size="small"
          placeholder={t('organigrama.form.fields.code.placeholder')}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          sx={{ flex: 1 }}
        />
      </Box>

      {/* Nombre */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.positionName.label')}</BlockLabel>
        <TextField
          size="small"
          placeholder={t('organigrama.form.fields.positionName.placeholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flex: 1 }}
          required
        />
      </Box>

      {/* Habilidades */}
      <Box sx={{ display: 'flex' }}>
        <BlockLabel sx={{ height: 40, lineHeight: 'inherit' }}>
          {t('organigrama.form.fields.skills.label')}
        </BlockLabel>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap', mb: 2, minHeight: 32 }}>
            {selectedSkills.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                onDelete={() => handleRemoveSkill(skill)}
                color="primary"
                variant="soft"
                size="small"
                sx={{
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'white',
                  }
                }}
              />
            ))}

            <Tooltip title={t('organigrama.form.fields.skills.add')}>
              <IconButton
                size="small"
                onClick={skillsDialog.onTrue}
                sx={[
                  (theme) => ({
                    border: `dashed 1px ${theme.vars.palette.divider}`,
                    bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                    '&:hover': {
                      bgcolor: 'primary.lighter',
                      borderColor: 'primary.main',
                    }
                  }),
                ]}
              >
                <Iconify icon="mingcute:add-line" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Empleados */}
      <Box sx={{ display: 'flex' }}>
        <BlockLabel sx={{ height: 40, lineHeight: '40px' }}>
          {t('organigrama.form.fields.employees.label')}
        </BlockLabel>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap', mb: 2, minHeight: 32 }}>
            {assignedEmployees.map((employee) => (
              <Box 
                key={employee.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 1,
                  bgcolor: 'background.neutral',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Avatar src={employee.avatarUrl} alt={employee.name} sx={{ width: 28, height: 28 }}>
                  {!employee.avatarUrl && employee.firstName?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {employee.firstName} {employee.firstLastName}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveEmployee(employee.id)}
                  sx={{ 
                    ml: 0.5,
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'error.lighter',
                    }
                  }}
                >
                  <Iconify icon="mingcute:close-line" width={14} />
                </IconButton>
              </Box>
            ))}

            <Tooltip title={t('organigrama.form.fields.employees.add')}>
              <IconButton
                size="small"
                onClick={employeesDialog.onTrue}
                sx={[
                  (theme) => ({
                    border: `dashed 1px ${theme.vars.palette.divider}`,
                    bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                    width: 32,
                    height: 32,
                    '&:hover': {
                      bgcolor: 'success.lighter',
                      borderColor: 'success.main',
                    }
                  }),
                ]}
              >
                <Iconify icon="mingcute:add-line" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* ✅ Número de Empleados Requeridos */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.requiredEmployees.label')}</BlockLabel>
        <TextField
          size="small"
          type="number"
          placeholder={t('organigrama.form.fields.requiredEmployees.placeholder')}
          value={requiredEmployees}
          onChange={(e) => setRequiredEmployees(Math.max(1, parseInt(e.target.value, 10) || 1))}
          sx={{ flex: 1 }}
          helperText={t('organigrama.form.fields.requiredEmployees.helper')}
        />
      </Box>

      {/* Descripción */}
      <Box sx={{ display: 'flex' }}>
        <BlockLabel>{t('organigrama.form.fields.description.label')}</BlockLabel>
        <TextField
          fullWidth
          multiline
          size="small"
          minRows={3}
          placeholder={t('organigrama.form.fields.description.placeholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          slotProps={{ 
            input: { 
              sx: { 
                typography: 'body2',
                '&::placeholder': {
                  color: 'text.disabled',
                  opacity: 1,
                }
              } 
            } 
          }}
        />
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
          paper: { sx: { width: { xs: 1, sm: 520 } } }, // ✅ Ancho aumentado para acomodar el selector de cargo padre
        }}
      >
        {renderToolbar()}

        <Scrollbar fillContent sx={{ py: 3, px: 2.5 }}>
          {renderContent()}
        </Scrollbar>

        <Box
          sx={{
            p: 2.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 2,
          }}
        >
          <Button 
            variant="outlined" 
            onClick={onClose} 
            sx={{ flex: 1 }} 
            disabled={loading}
            startIcon={<Iconify icon="mingcute:close-line" />}
          >
            {t('organigrama.form.actions.cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            sx={{ flex: 1 }}
            disabled={loading || !name.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <Iconify icon={editData ? "solar:pen-bold" : "mingcute:add-line"} />}
          >
            {loading 
              ? t('organigrama.form.actions.saving')
              : editData 
              ? t('organigrama.form.actions.update')
              : t('organigrama.form.actions.create')
            }
          </Button>
        </Box>
      </Drawer>

      <OrganizationSkillsDialog
        open={skillsDialog.value}
        onClose={skillsDialog.onFalse}
        onSelectSkill={handleAddSkill}
        selectedSkills={selectedSkills}
      />

      <OrganizationEmployeesDialog
        open={employeesDialog.value}
        onClose={employeesDialog.onFalse}
        onSelectEmployee={handleAddEmployee}
        selectedEmployees={assignedEmployees}
      />
    </>
  );
}