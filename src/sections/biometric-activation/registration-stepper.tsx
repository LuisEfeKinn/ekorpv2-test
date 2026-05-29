import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Stepper from '@mui/material/Stepper';
import { alpha } from '@mui/material/styles';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export interface StepConfig {
  label: string;
  description: string;
  icon: any; // Iconify icon string
}

interface RegistrationStepperProps {
  activeStep: number;
  steps: StepConfig[];
}

export function RegistrationStepper({ activeStep, steps }: RegistrationStepperProps) {
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          '& .MuiStepLabel-root .Mui-completed': {
            color: 'success.main',
          },
          '& .MuiStepLabel-root .Mui-active': {
            color: 'primary.main',
          },
        }}
      >
        {steps.map((step, index) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;

          return (
            <Step key={step.label} completed={isCompleted}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: isCompleted
                        ? 'success.main'
                        : isActive
                          ? 'primary.main'
                          : (theme) => alpha(theme.palette.grey[500], 0.12),
                      color: isCompleted || isActive ? 'common.white' : 'text.disabled',
                      transition: 'all 0.3s ease',
                      ...(isActive && {
                        boxShadow: (theme) =>
                          `0 0 0 4px ${alpha(theme.palette.primary.main, 0.16)}`,
                      }),
                    }}
                  >
                    {isCompleted ? (
                      <Iconify icon="solar:check-circle-bold" width={24} />
                    ) : (
                      <Iconify icon={step.icon} width={24} />
                    )}
                  </Box>
                )}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    mt: 1,
                    color: isActive ? 'text.primary' : 'text.secondary',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {step.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  {step.description}
                </Typography>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
}

// Función para obtener los pasos traducidos
export function useRegisterSteps(): StepConfig[] {
  const { t } = useTranslate('common');
  
  return [
    {
      label: t('register.steps.documentFront.label'),
      description: t('register.steps.documentFront.description'),
      icon: 'solar:card-bold',
    },
    {
      label: t('register.steps.documentBack.label'),
      description: t('register.steps.documentBack.description'),
      icon: 'solar:card-recive-bold',
    },
    {
      label: t('register.steps.livenessCheck.label'),
      description: t('register.steps.livenessCheck.description'),
      icon: 'solar:shield-check-bold',
    },
    {
      label: t('register.steps.facialCapture.label'),
      description: t('register.steps.facialCapture.description'),
      icon: 'solar:camera-add-bold',
    }
  ];
}

// Configuración por defecto de los pasos (deprecated - usar useRegisterSteps)
export const DEFAULT_REGISTER_STEPS: StepConfig[] = [
  {
    label: 'Documento (Frente)',
    description: 'Captura el frente de tu documento',
    icon: 'solar:card-bold',
  },
  {
    label: 'Documento (Reverso)',
    description: 'Captura el reverso de tu documento',
    icon: 'solar:card-recive-bold',
  },
  {
    label: 'Verificación Facial',
    description: 'Verifica tu identidad',
    icon: 'solar:user-id-bold',
  }
];
