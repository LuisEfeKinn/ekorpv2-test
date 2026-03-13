import type { OrganizationalUnitFlowNode } from 'src/services/organization/organizationalUnit.service';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type OrganizationalUnitChartNodeProps = OrganizationalUnitFlowNode & {
  name: string;
  children: OrganizationalUnitChartNodeProps[];
  hasChildren: boolean;
};

type NodeProps = {
  node: OrganizationalUnitChartNodeProps;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onDoubleClick?: () => void;
};

export function OrganizationalUnitChartNode({
  node,
  isCollapsed,
  onToggleCollapse,
  onDoubleClick,
}: NodeProps) {
  const theme = useTheme();

  // Safe access to palette colors with fallback
  const primaryMain = theme.palette?.primary?.main || '#000';
  const color = node.data?.color || primaryMain;
  const bgColor = alpha(color, 0.16);
  const code = node.data?.code || '';
  const name = node.data?.name || node.label || '';
  const hasChildren = (node.children?.length ?? 0) > 0;
  const showCollapseButton = hasChildren || isCollapsed;

  return (
    <Box sx={{ position: 'relative', display: 'inline-block', margin: '10px' }}>
      <Card
        onDoubleClick={onDoubleClick}
        sx={{
          p: 2,
          minWidth: 280,
          maxWidth: 340,
          borderRadius: 2,
          cursor: 'pointer',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: color,
            boxShadow: theme.customShadows.z20,
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
            <Iconify icon={'solar:buildings-2-bold-duotone' as any} width={24} />
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
            {code && (
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                {code}
              </Typography>
            )}

            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
              {name}
            </Typography>
          </Box>

          {showCollapseButton && (
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                onToggleCollapse();
              }}
              sx={{
                width: 28,
                height: 28,
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                },
              }}
            >
              <Iconify
                icon={isCollapsed ? 'eva:arrow-ios-forward-fill' : 'eva:arrow-ios-downward-fill'}
                width={14}
              />
            </IconButton>
          )}
        </Box>
      </Card>
    </Box>
  );
}
