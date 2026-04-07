import type { ISkills } from 'src/types/employees';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useRef, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import {
  GetTypeSkillService,
  SaveOrUpdateSkillsService,
} from 'src/services/employees/skills.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type SkillsCreateSchemaType = {
  name: string;
  description?: string;
  code?: string;
  color?: string;
  expectedLevel?: number;
  typeId?: string;
};

// ----------------------------------------------------------------------

type Props = {
  currentSkills?: ISkills;
};

export function SkillsCreateEditForm({ currentSkills }: Props) {
  const router = useRouter();
  const { t } = useTranslate('employees');
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [typeOptions, setTypeOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    GetTypeSkillService()
      .then((res) => {
        const list = res.data?.data?.data || [];
        setTypeOptions(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  const SkillsCreateSchema = z.object({
    name: z.string().min(1, { message: t('skills.form.name.required') }),
    description: z.string().optional(),
    code: z.string().optional(),
    color: z.string().optional(),
    expectedLevel: z.coerce.number().optional(),
    typeId: z.string().optional(),
  });

  const defaultValues: SkillsCreateSchemaType = {
    name: '',
    description: '',
    code: '',
    color: '#6177d6ff',
    expectedLevel: undefined,
    typeId: '',
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(SkillsCreateSchema),
    defaultValues,
    values: currentSkills,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        ...data,
        typeId: data.typeId ? Number(data.typeId) : undefined,
        expectedLevel: data.expectedLevel ? Number(data.expectedLevel) : undefined,
      };
      const response = await SaveOrUpdateSkillsService(
        payload,
        currentSkills?.id
      );

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        reset();
        toast.success(currentSkills ? t('skills.messages.updateSuccess') : t('skills.messages.createSuccess'));
        router.push(paths.dashboard.employees.skills); // Ajustar la ruta según tu configuración
      }
    } catch (error: any) {
      console.error('Error saving skills:', error);
      toast.error(t(error?.message || 'skills.messages.saveError'));
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('skills.form.sections.details')}</Typography>

        <Field.Text
          name="name"
          label={t('skills.form.fields.name.label')}
          helperText={t('skills.form.fields.name.helperText')}
        />

        <Field.Text
          name="code"
          label={t('skills.form.fields.code.label')}
          helperText={t('skills.form.fields.code.helperText')}
        />

        <Field.Text
          name="description"
          label={t('skills.form.fields.description.label')}
          helperText={t('skills.form.fields.description.helperText')}
          multiline
          rows={3}
        />

        <Field.Select name="typeId" label={t('skills.form.fields.typeId.label')}>
          <MenuItem value="">{t('skills.form.fields.typeId.placeholder')}</MenuItem>
          {typeOptions.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>
              {opt.name}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Text
          name="expectedLevel"
          label={t('skills.form.fields.expectedLevel.label')}
          helperText={t('skills.form.fields.expectedLevel.helperText')}
          type="number"
          slotProps={{ htmlInput: { min: 1 } }}
        />

        <Box sx={{ position: 'relative' }}>
        <Field.Text
          name="color"
          label={t('skills.form.fields.color.label')}
          helperText={t('skills.form.fields.color.helperText')}
          slotProps={{
            input: {
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    onClick={() => colorInputRef.current?.click()}
                    size="small"
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: methods.watch('color') || '#1976d2',
                      border: '2px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        backgroundColor: methods.watch('color') || '#1976d2',
                        transform: 'scale(1.1)',
                        borderColor: 'primary.main',
                        boxShadow: (theme) => theme.shadows[8],
                      },
                      '&:active': {
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                        transform: 'translateX(-100%)',
                        transition: 'transform 0.6s',
                      },
                      '&:hover::before': {
                        transform: 'translateX(100%)',
                      },
                    }}
                  >
                    <Iconify 
                      icon="solar:palette-bold" 
                      sx={{ 
                        color: 'white',
                        filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))',
                        fontSize: 20,
                      }} 
                    />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => colorInputRef.current?.click()}
                    size="small"
                    sx={{
                      '&:hover': {
                        color: 'primary.main',
                        transform: 'rotate(15deg)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <Iconify icon="solar:pen-bold" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  textAlign: 'center',
                  letterSpacing: '0.1em',
                },
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
              },
            },
          }}
          onClick={() => colorInputRef.current?.click()}
        />

        {/* Input de color oculto — dentro del Box relativo para que el picker aparezca junto al campo */}
        <input
          ref={colorInputRef}
          type="color"
          value={methods.watch('color') || '#1976d2'}
          onChange={(e) => methods.setValue('color', e.target.value)}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            opacity: 0,
            pointerEvents: 'none',
            width: '100%',
            height: 1,
            border: 'none',
            padding: 0,
          }}
        />
        </Box>
      </Stack>
    </Card>
  );

  const renderActions = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-start' }}>
      <Button
        size="medium"
        variant="soft"
        color="inherit"
        onClick={() => router.back()}
      >
        {t('skills.actions.cancel')}
      </Button>

      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('skills.actions.saving')}
      >
        {currentSkills ? t('skills.actions.update') : t('skills.actions.create')}
      </Button>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        {renderDetails()}
        {renderActions()}
      </Stack>
    </Form>
  );
}