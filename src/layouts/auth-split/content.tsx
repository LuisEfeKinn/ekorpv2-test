'use client';

import type { BoxProps } from '@mui/material/Box';
import type { Breakpoint } from '@mui/material/styles';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';

import { layoutClasses } from '../core';

// ----------------------------------------------------------------------

export type AuthSplitContentProps = BoxProps & { layoutQuery?: Breakpoint };

export function AuthSplitContent({
  sx,
  children,
  className,
  layoutQuery = 'md',
  ...other
}: AuthSplitContentProps) {
  return (
    <Box
      className={mergeClasses([layoutClasses.content, className])}
      sx={[
        (theme) => ({
          display: 'flex',
          width: '100%',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          p: theme.spacing(3, 2, 5, 2),
          [theme.breakpoints.up(layoutQuery)]: {
            width: '30%',
            minWidth: 400,
            flex: 'none',
            p: theme.spacing(10, 3, 10, 3),
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        sx={{
          width: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 'var(--layout-auth-content-width)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
