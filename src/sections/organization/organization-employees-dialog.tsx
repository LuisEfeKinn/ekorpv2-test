'use client';

import type { IUserManagement } from 'src/types/employees';

import { useDebounce } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetUserManagmentPaginationService } from 'src/services/employees/user-managment.service';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { SearchNotFound } from 'src/components/search-not-found';

// ----------------------------------------------------------------------

const ITEM_HEIGHT = 64;

type Employee = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  firstName?: string;
  secondName?: string;
  firstLastName?: string;
  secondLastName?: string;
  position?: string;
  skills?: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectEmployee: (employee: Employee) => void;
  selectedEmployees: Employee[];
};

export function OrganizationEmployeesDialog({ open, onClose, onSelectEmployee, selectedEmployees }: Props) {
  const { t } = useTranslate('organization');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const debouncedSearch = useDebounce(searchEmployee, 500);

  const fetchEmployees = useCallback(async () => {
    if (!open) return;

    setLoading(true);
    try {
      const params: any = {
        page: 1,
        perPage: 20,
      };

      // Agregar búsqueda si existe
      if (debouncedSearch?.trim()) {
        params.search = debouncedSearch.trim();
      }

      const response = await GetUserManagmentPaginationService(params);

      if (response.data?.data) {
        const employeesData: Employee[] = response.data.data.map((emp: IUserManagement) => {
          const nameParts = [
            emp.firstName,
            emp.secondName,
            emp.firstLastName,
            emp.secondLastName
          ].filter(part => part?.trim()).join(' ');

          return {
            id: emp.id,
            name: nameParts || t('organigrama.dialogs.employees.fallbacks.noName'),
            email: emp.email || t('organigrama.dialogs.employees.fallbacks.noEmail'),
            avatarUrl: undefined,
            firstName: emp.firstName,
            secondName: emp.secondName,
            firstLastName: emp.firstLastName,
            secondLastName: emp.secondLastName,
            position: emp.position?.name,
            skills: emp.skills?.map(skill => skill.name) || [],
          };
        });

        setEmployees(employeesData);
        setTotalEmployees(response.data.meta?.itemCount || employeesData.length);
      } else {
        setEmployees([]);
        setTotalEmployees(0);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
      setTotalEmployees(0);
    } finally {
      setLoading(false);
    }
  }, [open, debouncedSearch, t]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearchEmployees = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchEmployee(event.target.value);
  }, []);

  const handleSelectEmployee = (employee: Employee) => {
    onSelectEmployee(employee);
  };

  const notFound = !employees.length && !loading && debouncedSearch;

  return (
    <Dialog 
      fullWidth 
      maxWidth="xs" 
      open={open} 
      onClose={onClose}
    >
      <DialogTitle 
        sx={{ 
          pb: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}
      >
        <Box>
          {t('organigrama.dialogs.employees.title')} <span>({totalEmployees})</span>
          <Box component="span" sx={{ 
            fontSize: '0.75rem', 
            color: 'text.secondary',
            display: 'block',
            fontWeight: 400 
          }}>
            {t('organigrama.dialogs.employees.subtitle')}
          </Box>
        </Box>
        
        <IconButton 
          onClick={onClose}
          size="small"
          sx={{ 
            color: 'text.secondary',
            '&:hover': { 
              color: 'text.primary',
              bgcolor: 'action.hover' 
            }
          }}
        >
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, py: 2.5 }}>
        <TextField
          fullWidth
          value={searchEmployee}
          onChange={handleSearchEmployees}
          placeholder={t('organigrama.dialogs.employees.search')}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
              endAdornment: loading ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : null,
            },
          }}
        />
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {loading && !employees.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : notFound ? (
          <SearchNotFound query={debouncedSearch} sx={{ mt: 3, mb: 10 }} />
        ) : (
          <Scrollbar sx={{ height: ITEM_HEIGHT * 6, px: 2.5 }}>
            <Box component="ul">
              {employees.map((employee) => {
                const isSelected = selectedEmployees.some(emp => emp.id === employee.id);
                const initials = employee.name
                  .split(' ')
                  .map(word => word.charAt(0))
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);

                return (
                  <Box
                    component="li"
                    key={employee.id}
                    sx={{
                      gap: 2,
                      display: 'flex',
                      height: ITEM_HEIGHT,
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderRadius: 1,
                      px: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => handleSelectEmployee(employee)}
                  >
                    <Avatar src={employee.avatarUrl} alt={employee.name}>
                      {!employee.avatarUrl && initials}
                    </Avatar>

                    <ListItemText 
                      primary={employee.name} 
                      secondary={
                        <Box>
                          <Box component="span" sx={{ display: 'block' }}>
                            {employee.email}
                          </Box>
                        </Box>
                      }
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: 500,
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.secondary',
                      }}
                    />

                    <Button
                      size="small"
                      color={isSelected ? 'success' : 'primary'}
                      variant={isSelected ? 'contained' : 'outlined'}
                      startIcon={
                        <Iconify
                          width={16}
                          icon={isSelected ? 'eva:checkmark-fill' : 'mingcute:add-line'}
                          sx={{ mr: -0.5 }}
                        />
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectEmployee(employee);
                      }}
                      sx={{
                        minWidth: 100,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isSelected ? t('organigrama.dialogs.employees.actions.assigned') : t('organigrama.dialogs.employees.actions.assign')}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </Scrollbar>
        )}
      </DialogContent>

      <Box sx={{ 
        p: 2.5, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: 'success.main' }} />
          <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
            {selectedEmployees.length === 0 
              ? t('organigrama.dialogs.employees.selected.none')
              : selectedEmployees.length === 1
              ? t('organigrama.dialogs.employees.selected.one')
              : t('organigrama.dialogs.employees.selected.multiple', { count: selectedEmployees.length })
            }
          </Box>
        </Box>
        
        <Button 
          variant="contained" 
          onClick={onClose}
          startIcon={<Iconify icon="eva:checkmark-fill" />}
        >
          {t('organigrama.dialogs.employees.actions.done')}
        </Button>
      </Box>
    </Dialog>
  );
}