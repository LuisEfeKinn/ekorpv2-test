'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

export type NodeDataCentral = {
  id: string;
  label: string;
};

export type NodeDataChild = {
  id: string;
  label: string;
  color: string;
  onClick: () => void;
};

function CentralNode({ data }: { data: NodeDataCentral }) {
  const theme = useTheme();

  const primaryMain = theme.palette.primary?.main || '#000000';
  const primaryDark = theme.palette.primary?.dark || '#000000';
  const commonWhite = theme.palette.common?.white || '#FFFFFF';
  const commonBlack = theme.palette.common?.black || '#000000';

  return (
    <Paper
      elevation={16}
      sx={{
        px: { xs: 3, sm: 4, md: 5 },
        py: { xs: 3, sm: 3.5, md: 4 },
        borderRadius: 3,
        background: `linear-gradient(135deg, ${primaryMain} 0%, ${primaryDark} 100%)`,
        boxShadow: `0 12px 40px ${alpha(primaryMain, 0.5)}`,
        cursor: 'grab',
        minWidth: 320,
        position: 'relative',
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          width: 0,
          height: 0,
          border: 'none',
          background: 'transparent',
        }}
      />

      <Stack spacing={1.5} alignItems="center">
        <Chip
          label={`ID: ${String(data.id)}`}
          size="small"
          sx={{
            bgcolor: alpha(commonWhite, 0.22),
            color: 'common.white',
            fontWeight: 700,
            fontSize: '0.75rem',
            height: 24,
            backdropFilter: 'blur(10px)',
          }}
        />
        <Typography
          variant="h5"
          sx={{
            color: 'common.white',
            fontWeight: 800,
            textAlign: 'center',
            textShadow: `0 3px 12px ${alpha(commonBlack, 0.4)}`,
            letterSpacing: '-0.5px',
            lineHeight: 1.3,
          }}
        >
          {String(data.label || 'Sin nombre')}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: alpha(commonWhite, 0.85), fontWeight: 600, fontSize: '0.7rem' }}
        >
          Unidad organizacional
        </Typography>
      </Stack>
    </Paper>
  );
}

function ChildNode({ data }: { data: NodeDataChild }) {
  const theme = useTheme();
  const backgroundPaper = theme.palette.background?.paper || '#FFFFFF';

  return (
    <Paper
      elevation={6}
      onClick={data.onClick}
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: { xs: 2, sm: 2.5 },
        borderRadius: 2.5,
        background: backgroundPaper,
        border: `2px solid ${alpha(data.color, 0.3)}`,
        boxShadow: `0 4px 20px ${alpha(data.color, 0.2)}`,
        cursor: 'pointer',
        minWidth: 200,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px) scale(1.03)',
          boxShadow: `0 8px 32px ${alpha(data.color, 0.35)}`,
          borderColor: data.color,
        },
        '&:active': { transform: 'scale(0.98)' },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${data.color}, ${alpha(data.color, 0.6)})`,
          boxShadow: `0 2px 8px ${alpha(data.color, 0.3)}`,
        },
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          width: 0,
          height: 0,
          border: 'none',
          background: 'transparent',
        }}
      />

      <Stack spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: alpha(data.color, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${alpha(data.color, 0.2)}`,
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: data.color,
              boxShadow: `0 3px 12px ${alpha(data.color, 0.5)}`,
            }}
          />
        </Box>

        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            textAlign: 'center',
            color: 'text.primary',
            fontSize: '0.95rem',
            letterSpacing: '-0.2px',
            lineHeight: 1.2,
          }}
        >
          {String(data.label || 'Sin nombre')}
        </Typography>

        <Chip
          label={String(data.id)}
          size="small"
          sx={{
            bgcolor: alpha(data.color, 0.1),
            color: data.color,
            fontWeight: 600,
            fontSize: '0.72rem',
            height: 22,
            border: `1px solid ${alpha(data.color, 0.2)}`,
          }}
        />
      </Stack>
    </Paper>
  );
}

export const organizationalStructureNodeTypes = { central: CentralNode, child: ChildNode };
