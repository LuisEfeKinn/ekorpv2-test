
import type { BoxProps } from '@mui/material/Box';
import type { JobFlowNode } from 'src/types/job-flow';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface Props extends BoxProps {
  node: JobFlowNode;
}

export function JobFlowChartNode({ node, sx, ...other }: Props) {
  const theme = useTheme();

  // Determine color based on measure type or other logic if needed
  const color = theme.vars.palette.info.main;
  const bgColor = theme.vars.palette.info.lighter;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-block',
        margin: '10px',
        ...sx,
      }}
      {...other}
    >
      <Card
        sx={{
          p: 2,
          minWidth: 280,
          maxWidth: 320,
          borderRadius: 2,
          cursor: 'default',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: theme.customShadows.z20,
            borderColor: color,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: bgColor,
              color,
              border: `2px solid ${color}`,
            }}
          >
            <Iconify icon={"solar:user-id-bold-duotone" as any} width={24} />
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {node.data.code || 'N/A'}
            </Typography>

            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
              {node.data.name}
            </Typography>

            {node.data.minimumAcademicLevel && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <Iconify icon={"solar:hat-bold-duotone" as any} width={14} sx={{ color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {node.data.minimumAcademicLevel}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
