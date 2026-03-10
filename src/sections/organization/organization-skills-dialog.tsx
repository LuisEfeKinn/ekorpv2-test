'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { SearchNotFound } from 'src/components/search-not-found';

// ----------------------------------------------------------------------

// ✅ Data de ejemplo mantenida
const AVAILABLE_SKILLS = [
  'Liderazgo',
  'Comunicación', 
  'Trabajo en equipo',
  'Resolución de problemas',
  'Gestión del tiempo',
  'Creatividad',
  'Adaptabilidad',
  'Pensamiento crítico',
  'Negociación',
  'Gestión de proyectos',
  'Análisis de datos',
  'Programación',
  'Marketing digital',
  'Ventas',
  'Servicio al cliente',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'SQL',
];

const ITEM_HEIGHT = 64;

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectSkill: (skill: string) => void;
  selectedSkills: string[];
};

export function OrganizationSkillsDialog({ open, onClose, onSelectSkill, selectedSkills }: Props) {
  const { t } = useTranslate('organization');
  const [searchSkill, setSearchSkill] = useState('');

  const handleSearchSkills = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchSkill(event.target.value);
  }, []);

  const dataFiltered = applyFilter({ inputData: AVAILABLE_SKILLS, query: searchSkill });

  const notFound = !dataFiltered.length && !!searchSkill;

  const handleSelectSkill = (skill: string) => {
    onSelectSkill(skill);
  };

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
          {t('organigrama.dialogs.skills.title')} <span>({AVAILABLE_SKILLS.length})</span>
          <Box component="span" sx={{ 
            fontSize: '0.75rem', 
            color: 'text.secondary',
            display: 'block',
            fontWeight: 400 
          }}>
            {t('organigrama.dialogs.skills.subtitle')}
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
          value={searchSkill}
          onChange={handleSearchSkills}
          placeholder={t('organigrama.dialogs.skills.search')}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {notFound ? (
          <SearchNotFound query={searchSkill} sx={{ mt: 3, mb: 10 }} />
        ) : (
          <Scrollbar sx={{ height: ITEM_HEIGHT * 6, px: 2.5 }}>
            <Box component="ul">
              {dataFiltered.map((skill) => {
                const isSelected = selectedSkills.includes(skill);

                return (
                  <Box
                    component="li"
                    key={skill}
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
                    onClick={() => handleSelectSkill(skill)}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          lineHeight: 1.2,
                        }}
                      >
                        {skill}
                      </Box>
                      <Box
                        sx={{
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          mt: 0.25,
                        }}
                      >
                        {t('organigrama.dialogs.skills.types.technical')}
                      </Box>
                    </Box>

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
                        handleSelectSkill(skill);
                      }}
                      sx={{
                        minWidth: 100,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isSelected ? t('organigrama.dialogs.skills.actions.added') : t('organigrama.dialogs.skills.actions.add')}
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
            {selectedSkills.length === 0 
              ? t('organigrama.dialogs.skills.selected.none')
              : selectedSkills.length === 1
              ? t('organigrama.dialogs.skills.selected.one')
              : t('organigrama.dialogs.skills.selected.multiple', { count: selectedSkills.length })
            }
          </Box>
        </Box>
        
        <Button 
          variant="contained" 
          onClick={onClose}
          startIcon={<Iconify icon="eva:checkmark-fill" />}
        >
          {t('organigrama.dialogs.skills.actions.done')}
        </Button>
      </Box>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  query: string;
  inputData: string[];
};

function applyFilter({ inputData, query }: ApplyFilterProps) {
  if (!query) return inputData;

  return inputData.filter((skill) =>
    skill.toLowerCase().includes(query.toLowerCase())
  );
}