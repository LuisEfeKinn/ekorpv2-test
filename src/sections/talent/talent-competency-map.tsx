import type { CardProps } from '@mui/material/Card';
import type { CompetencyLevel } from 'src/_mock/_talent';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  list: CompetencyLevel[];
};

export function TalentCompetencyMap({ title, subheader, list, ...other }: Props) {
  const { t } = useTranslate('dashboard');

  return (
    <Card {...other}>
      <CardHeader 
        title={t('talent.competencyMap.title')} 
        subheader={t('talent.competencyMap.subtitle')} 
      />

      <Stack spacing={3} sx={{ px: 3, py: 4 }}>
        {list.map((competency) => (
          <CompetencyItem key={competency.id} competency={competency} />
        ))}
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

type CompetencyItemProps = {
  competency: CompetencyLevel;
};

function CompetencyItem({ competency }: CompetencyItemProps) {
  const { t } = useTranslate('dashboard');

  const getColor = (level: string) => {
    if (t(level) === t('talent.nineBox.levels.high')) return 'success';
    if (t(level) === t('talent.nineBox.levels.medium')) return 'warning';
    return 'error';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2">{t(`${competency.name}`)}</Typography>
        <Label color={getColor(competency.level)} variant="soft">
          {t(`${competency.level}`)}
        </Label>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1}>
        <LinearProgress
          variant="determinate"
          value={competency.score}
          color={getProgressColor(competency.score)}
          sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
        />
        <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
          {competency.score}%
        </Typography>
      </Stack>
    </Box>
  );
}
