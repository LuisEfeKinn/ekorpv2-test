import type { CardProps } from '@mui/material/Card';
import type { NineBoxEmployee } from 'src/_mock/_talent';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import AvatarGroup from '@mui/material/AvatarGroup';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  employees: NineBoxEmployee[];
};

export function TalentNineBox({ title, subheader, employees, ...other }: Props) {
  const { t } = useTranslate('dashboard');

  // Organizar empleados por cuadrante
  const getEmployeesByBox = (performance: number, potential: number) =>
    employees.filter((emp) => emp.performance === performance && emp.potential === potential);

  // Definir colores y etiquetas para cada cuadrante
  const getBoxConfig = (performance: number, potential: number) => {
    const configs = {
      '3-3': { label: t('talent.nineBox.categories.star'), color: '#00A76F', bgColor: 'rgba(0, 167, 111, 0.08)' },
      '3-2': { label: t('talent.nineBox.categories.keyProfessional'), color: '#00B8D9', bgColor: 'rgba(0, 184, 217, 0.08)' },
      '3-1': { label: t('talent.nineBox.categories.technicalExpert'), color: '#2065D1', bgColor: 'rgba(32, 101, 209, 0.08)' },
      '2-3': { label: t('talent.nineBox.categories.highPotential'), color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.08)' },
      '2-2': { label: t('talent.nineBox.categories.effectiveCollaborator'), color: '#FFAB00', bgColor: 'rgba(255, 171, 0, 0.08)' },
      '2-1': { label: t('talent.nineBox.categories.needsDevelopment'), color: '#FF5630', bgColor: 'rgba(255, 86, 48, 0.08)' },
      '1-3': { label: t('talent.nineBox.categories.emergingTalent'), color: '#7635DC', bgColor: 'rgba(118, 53, 220, 0.08)' },
      '1-2': { label: t('talent.nineBox.categories.inconsistent'), color: '#FF9800', bgColor: 'rgba(255, 152, 0, 0.08)' },
      '1-1': { label: t('talent.nineBox.categories.lowPerformance'), color: '#B71D18', bgColor: 'rgba(183, 29, 24, 0.08)' },
    };
    return configs[`${performance}-${potential}` as keyof typeof configs];
  };

  return (
    <Card {...other}>
      <CardHeader 
        title={t('talent.nineBox.title')} 
        subheader={t('talent.nineBox.subtitle')} 
      />

      <Box sx={{ p: 3 }}>
        {/* Etiqueta del eje Y (Potencial) */}
        <Box
          sx={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'rotate(-90deg) translateX(-50%)',
            transformOrigin: 'left center',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'text.secondary',
            whiteSpace: 'nowrap',
          }}
        >
          {t('talent.nineBox.potential').toUpperCase()}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, ml: 4 }}>
          {/* Fila 3 - Alto Potencial */}
          {[1, 2, 3].map((performance) => (
            <NineBoxCell
              key={`3-${performance}`}
              config={getBoxConfig(performance, 3)}
              employees={getEmployeesByBox(performance, 3)}
            />
          ))}

          {/* Fila 2 - Medio Potencial */}
          {[1, 2, 3].map((performance) => (
            <NineBoxCell
              key={`2-${performance}`}
              config={getBoxConfig(performance, 2)}
              employees={getEmployeesByBox(performance, 2)}
            />
          ))}

          {/* Fila 1 - Bajo Potencial */}
          {[1, 2, 3].map((performance) => (
            <NineBoxCell
              key={`1-${performance}`}
              config={getBoxConfig(performance, 1)}
              employees={getEmployeesByBox(performance, 1)}
            />
          ))}
        </Box>

        {/* Etiqueta del eje X (Desempeño) */}
        <Box
          sx={{
            mt: 2,
            ml: 4,
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          {t('talent.nineBox.performance').toUpperCase()}
        </Box>

        {/* Leyenda de niveles */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            mt: 2,
            ml: 4,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#B71D18', borderRadius: 0.5 }} />
            <Typography variant="caption">{t('talent.nineBox.levels.low')}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#FFAB00', borderRadius: 0.5 }} />
            <Typography variant="caption">{t('talent.nineBox.levels.medium')}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#00A76F', borderRadius: 0.5 }} />
            <Typography variant="caption">{t('talent.nineBox.levels.high')}</Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

type NineBoxCellProps = {
  config: {
    label: string;
    color: string;
    bgColor: string;
  };
  employees: NineBoxEmployee[];
};

function NineBoxCell({ config, employees }: NineBoxCellProps) {
  const { t } = useTranslate('dashboard');

  return (
    <Box
      sx={{
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        minHeight: 160,
        bgcolor: config.bgColor,
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[8],
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Título del cuadrante */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontWeight: 600,
          color: config.color,
          mb: 1.5,
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          lineHeight: 1.2,
          minHeight: 28,
        }}
      >
        {config.label}
      </Typography>

      {/* Empleados en este cuadrante */}
      {employees.length > 0 ? (
        <Box>
          <AvatarGroup
            max={4}
            sx={{
              mb: 1,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                fontSize: '0.875rem',
                border: '2px solid',
                borderColor: 'background.paper',
              },
            }}
          >
            {employees.map((emp) => (
              <Tooltip
                key={emp.id}
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {emp.name}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.25 }}>
                      {emp.position}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                      {emp.email}
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <Avatar src={emp.avatar} alt={emp.name} />
              </Tooltip>
            ))}
          </AvatarGroup>

          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            {employees.length} {employees.length === 1 ? t('talent.nineBox.employee') : t('talent.nineBox.employees')}
          </Typography>

          {/* Mostrar nombres si son pocos */}
          {employees.length <= 2 && (
            <Box sx={{ mt: 0.5 }}>
              {employees.map((emp) => (
                <Typography
                  key={emp.id}
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 500,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {emp.name}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      ) : (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {t('talent.nineBox.noEmployees')}
        </Typography>
      )}
    </Box>
  );
}
